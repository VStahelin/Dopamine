"""Corta os loops das músicas geradas e converte para OGG e M4A (docs/sonoplastia.md).

Uso: python3 tools/audio/music.py   (precisa de Python 3 com numpy e do ffmpeg no PATH)

Lê as faixas de audio/musicas/ listadas em `tracks` de src/config/audio.json e grava public/audio/music/<id>.ogg e .m4a.
Cada faixa em loop toca a introdução uma vez e depois repete o trecho [loopFrom, loopTo] (em segundos do
arquivo final). O fim do arquivo já vem com um crossfade curto para o que vem antes de loopFrom, então a
volta não estala. Sem loopFrom e loopTo no JSON, o script procura os pontos sozinho (chroma e ataques
parecidos depois dos dois pontos) e grava o resultado no JSON; para ajustar de ouvido, edite os números e
rode de novo. Mudou um arquivo? Suba o `rev` da faixa, para o cache do jogo baixar de novo, e rode
`npm run format` (o script reescreve o JSON). O volume de todas vai para -16 LUFS.
"""
import json, os, subprocess
import numpy as np

SR = 48000
HOP = 1024
TARGET_LUFS = -16.0
XFADE = 0.25

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'audio', 'musicas')
OUT = os.path.join(ROOT, 'public', 'audio', 'music')
CONFIG = os.path.join(ROOT, 'src', 'config', 'audio.json')

def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    tail = r[r.rfind('Summary:'):]
    return float(tail[tail.find('I:'):].split(':')[1].split()[0])


def features(mono):
    """Por quadro: chroma (12 notas) e a força de ataque (onset), normalizados, para comparar trechos."""
    win = 4096
    n = 1 + (len(mono) - win) // HOP
    idx = np.arange(win)[None, :] + HOP * np.arange(n)[:, None]
    spec = np.abs(np.fft.rfft(mono[idx] * np.hanning(win), axis=1))
    freqs = np.fft.rfftfreq(win, 1 / SR)
    ok = (freqs > 55) & (freqs < 4000)
    pc = (np.round(12 * np.log2(freqs[ok] / 440.0)) % 12).astype(int)
    chroma = np.zeros((n, 12))
    for k in range(12):
        chroma[:, k] = spec[:, ok][:, pc == k].sum(axis=1)
    chroma = np.log1p(chroma)
    chroma -= chroma.mean(axis=0)
    chroma /= np.linalg.norm(chroma, axis=1, keepdims=True) + 1e-9
    logs = np.log1p(spec)
    onset = np.concatenate([[0], np.maximum(0, np.diff(logs, axis=0)).sum(axis=1)])
    onset = (onset - onset.mean()) / (onset.std() + 1e-9)
    # o onset entra como uma coluna extra com peso, para o ritmo também casar
    f = np.concatenate([chroma, 0.35 * onset[:, None] / np.sqrt(12)], axis=1)
    return f / (np.linalg.norm(f, axis=1, keepdims=True) + 1e-9)


def onset_fine(mono, hop=240):
    win = 1024
    n = 1 + (len(mono) - win) // hop
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    spec = np.log1p(np.abs(np.fft.rfft(mono[idx] * np.hanning(win), axis=1)))
    return np.concatenate([[0], np.maximum(0, np.diff(spec, axis=0)).sum(axis=1)])


def body_end(mono):
    f = HOP
    n = len(mono) // f
    r = np.sqrt((mono[:n * f].reshape(n, f) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(r)
    body = np.median(db[n // 5: 4 * n // 5])
    above = np.where(db > body - 6)[0]
    return (above[-1] + 1) * f


def find_loop(x):
    mono = x.mean(axis=1)
    feat = features(mono)
    W = int(6.0 * SR / HOP)
    end = body_end(mono) // HOP
    nf = len(feat)
    s_lo, s_hi = int(XFADE * SR / HOP) + 1, int(min(16.0, nf * HOP / SR / 4) * SR / HOP)
    e_lo = max(int(nf * 0.55), end - int(50 * SR / HOP))
    e_hi = min(end, nf) - W - 1
    A = feat[s_lo:s_hi + W]
    B = feat[e_lo:e_hi + W]
    D = A @ B.T
    C = np.zeros_like(D)
    C[0] = D[0]
    C[:, 0] = D[:, 0]
    for i in range(1, len(D)):
        C[i, 1:] = D[i, 1:] + C[i - 1, :-1]
    ns, ne = s_hi - s_lo, e_hi - e_lo
    sim = np.empty((ns, ne))
    for i in range(ns):
        top = C[i + W - 1, W - 1:W - 1 + ne]
        prev = C[i - 1, -1 + np.arange(ne)] if i > 0 else 0
        sim[i] = top - (np.where(np.arange(ne) > 0, prev, 0) if i > 0 else 0)
    sim /= W
    length = (np.arange(ne)[None, :] + e_lo) - (np.arange(ns)[:, None] + s_lo)
    score = sim + 0.02 * length / nf
    i, j = np.unravel_index(np.argmax(score), score.shape)
    S, E = (i + s_lo) * HOP, (j + e_lo) * HOP
    # ajuste fino pelos ataques (±60 ms, passo de 5 ms) para as batidas caírem juntas na volta
    hop = 240
    env = onset_fine(mono, hop)
    w = int(3.0 * SR / hop)
    ref = env[S // hop:S // hop + w]
    ref = (ref - ref.mean()) / (ref.std() + 1e-9)
    best, bestc = 0, -1e9
    for d in range(-12, 13):
        a = E // hop + d
        seg = env[a:a + w]
        if len(seg) < w:
            continue
        seg = (seg - seg.mean()) / (seg.std() + 1e-9)
        c = float(np.dot(seg, ref) / w)
        if c > bestc:
            best, bestc = d, c
    return S, E + best * hop, float(sim[i, j]), bestc


def bake(x, S, E):
    """Arquivo = x[0:E], com o fim misturado ao trecho antes de S: tocando E -> S, a música continua."""
    c = int(XFADE * SR)
    out = x[:E].copy()
    t = np.linspace(0, np.pi / 2, c)[:, None]
    out[-c:] = x[E - c:E] * np.cos(t) + x[S - c:S] * np.sin(t)
    return out


def encode(wav, track_id):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libvorbis', '-q:a', '2',
                    os.path.join(OUT, f'{track_id}.ogg')], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '96k',
                    os.path.join(OUT, f'{track_id}.m4a')], check=True)


def write_wav(path, x):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_s16le', path], input=x.astype(np.float32).tobytes(), check=True)


config = json.load(open(CONFIG, encoding='utf-8'))
tracks = config['tracks']
os.makedirs(OUT, exist_ok=True)
for tid, t in tracks.items():
    src = os.path.join(SRC, t['source'])
    x = decode(src)
    x *= 10 ** ((TARGET_LUFS - lufs(src)) / 20)
    if t['loop']:
        if 'loopFrom' not in t or 'loopTo' not in t:
            S, E, _, _ = find_loop(x)
            t['loopFrom'], t['loopTo'] = round(S / SR, 3), round(E / SR, 3)
        S, E = int(t['loopFrom'] * SR), int(t['loopTo'] * SR)
        x = bake(x, S, E)
    wav = os.path.join(OUT, f'{tid}.wav')
    write_wav(wav, x)
    encode(wav, tid)
    os.remove(wav)
    print(f"{tid}: {len(x) / SR:.1f} s" + (f", loop {t['loopFrom']} a {t['loopTo']}" if t['loop'] else ''))
with open(CONFIG, 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
    f.write('\n')
