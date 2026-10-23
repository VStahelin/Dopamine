"""Converte os efeitos sonoros gerados para OGG e M4A (docs/efeitos-sonoros.md).

Uso: python3 tools/audio/sfx.py   (precisa do ffmpeg no PATH)

Lê os efeitos de audio/efeitos/ listados em `sfx.effects` de src/config/audio.json e grava
public/audio/sfx/<id>.ogg e .m4a, em mono. Tira o silêncio do começo (o som sai no instante do
evento) e do fim, e leva todos ao mesmo volume (`sfx.targetLufs`). O volume de cada efeito no jogo
se ajusta depois por `volume` no JSON. Mudou um arquivo? Suba o `rev` do efeito, para o cache do
jogo baixar de novo.
"""
import json, os, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'audio', 'efeitos')
OUT = os.path.join(ROOT, 'public', 'audio', 'sfx')
CONFIG = os.path.join(ROOT, 'src', 'config', 'audio.json')

TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB'


def convert(src, sfx_id, lufs):
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, 'sfx.wav')
        chain = f'{TRIM},areverse,{TRIM},areverse,loudnorm=I={lufs}:TP=-1.5:LRA=11'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-af', chain,
                        '-ac', '1', '-ar', '44100', wav], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3',
                        os.path.join(OUT, f'{sfx_id}.ogg')], check=True)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-c:a', 'aac', '-b:a', '80k',
                        os.path.join(OUT, f'{sfx_id}.m4a')], check=True)


def main():
    with open(CONFIG, encoding='utf-8') as f:
        sfx = json.load(f)['sfx']
    os.makedirs(OUT, exist_ok=True)
    for sfx_id, effect in sfx['effects'].items():
        src = os.path.join(SRC, effect['source'])
        if not os.path.exists(src):
            print(f'{sfx_id}: falta {effect["source"]} em audio/efeitos/')
            continue
        convert(src, sfx_id, sfx['targetLufs'])
        size = os.path.getsize(os.path.join(OUT, f'{sfx_id}.ogg'))
        print(f'{sfx_id}: ok ({size // 1024} KB)')


if __name__ == '__main__':
    main()
