import { registerSW } from 'virtual:pwa-register';
import { flushSave } from '../storage/saveStore';
import { hideLoader, setLoaderStatus, showLoader } from '../ui/loader';
import {
  enterHub,
  initialState,
  onRemoteVersion,
  shouldAutoCheck,
  shouldPrompt,
  type RemoteVersion,
  type UpdateState,
} from './updateLogic';

type Listener = (state: UpdateState) => void;

/** Frequência com que o relógio interno confere se é hora de verificar (o intervalo real é 15 min). */
const TICK_MS = 60 * 1000;
/** Tempo máximo esperando a build nova baixar, na atualização manual. */
const DOWNLOAD_TIMEOUT_MS = 2 * 60 * 1000;
/** Recarrega por conta própria se o service worker não recarregar a página. */
const RELOAD_FALLBACK_MS = 8000;

/**
 * Gestor de atualização (docs/atualizacoes.md, decisão 0016). Pergunta ao servidor se há build
 * nova, deixa o service worker baixar a build inteira em segundo plano e avisa as telas quando ela
 * está pronta. Nunca recarrega sozinho: a troca só acontece em `apply()`, chamado pelo jogador.
 */
class UpdateManager {
  state: UpdateState = initialState(__APP_VERSION__, __BUILD_ID__);
  private listeners = new Set<Listener>();
  private registration?: ServiceWorkerRegistration;
  private activate?: (reload?: boolean) => Promise<void>;
  private started = false;

  /** Liga o service worker (só na build de produção) e a verificação periódica. */
  start(): void {
    if (this.started) return;
    this.started = true;
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      this.activate = registerSW({
        immediate: true,
        // O service worker novo terminou de baixar a build inteira e está esperando.
        onNeedRefresh: () => this.set({ status: 'ready' }),
        onRegisteredSW: (_url, registration) => {
          this.registration = registration;
        },
      });
    }
    setInterval(() => this.tick(), TICK_MS);
    window.addEventListener('online', () => this.tick());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** O jogador entrou no hub: começa uma visita nova e verifica se passou o intervalo. */
  enterHub(): void {
    this.state = enterHub(this.state);
    this.emit();
    this.tick();
  }

  /** O jogador começou uma run: nada de verificação nem de aviso até voltar. */
  leaveMenus(): void {
    this.set({ inMenu: false });
  }

  get shouldPrompt(): boolean {
    return shouldPrompt(this.state);
  }

  markPrompted(): void {
    this.set({ promptedThisVisit: true });
  }

  /** Verificação manual (botão das Opções) ou automática. */
  async check(): Promise<void> {
    if (this.state.status === 'checking' || this.state.status === 'ready') return;
    this.set({ status: 'checking', lastCheck: Date.now() });
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        this.set({ status: 'unavailable' });
        return;
      }
      const remote = (await res.json()) as RemoteVersion;
      const next = onRemoteVersion(this.state, remote);
      if (next.status === 'downloading' && !this.registration) {
        // Sem service worker (modo de desenvolvimento): só informa.
        this.set({ ...next, status: 'unavailable' });
        return;
      }
      this.set(next);
      if (next.status === 'downloading' && this.registration) {
        if (this.registration.waiting) this.set({ status: 'ready' });
        else await this.registration.update();
      }
    } catch {
      this.set({ status: navigator.onLine ? 'unavailable' : 'offline' });
    }
  }

  /**
   * ATUALIZAR: tela de atualização por cima de tudo (bloqueia o jogo), grava o save, ativa a build
   * nova e recarrega. A página nova abre já com a tela de carregamento.
   */
  async apply(): Promise<void> {
    if (this.state.status !== 'ready' || !this.activate) return;
    const version = this.state.remoteVersion ? ` ${this.state.remoteVersion}` : '';
    showLoader('ATUALIZANDO...', `Instalando a versão${version}. Não feche o jogo.`, true);
    await flushSave();
    // Se o navegador não recarregar sozinho, recarrega depois de alguns segundos.
    setTimeout(() => window.location.reload(), RELOAD_FALLBACK_MS);
    await this.activate(true);
  }

  /**
   * Botão das Opções: procura, baixa e instala de uma vez, com a tela de atualização bloqueando o
   * jogo. Sem versão nova (ou sem internet), a tela some e as Opções mostram o motivo.
   */
  async checkAndApply(): Promise<void> {
    if (this.state.status === 'ready') return this.apply();
    showLoader('PROCURANDO VERSÃO NOVA...', 'Só um instante.', true);
    await this.check();
    // Lido por função: o TypeScript não sabe que o await mudou o estado.
    if (this.status() === 'downloading') {
      const version = this.state.remoteVersion ? ` ${this.state.remoteVersion}` : '';
      setLoaderStatus(
        `BAIXANDO A VERSÃO${version}...`,
        'O jogo atual continua salvo. Não feche o jogo.',
      );
      await this.waitFor('ready', DOWNLOAD_TIMEOUT_MS);
    }
    if (this.status() === 'ready') return this.apply();
    hideLoader();
  }

  private status(): UpdateState['status'] {
    return this.state.status;
  }

  /** Espera o estado chegar em `status` (ou o tempo acabar). */
  private waitFor(status: UpdateState['status'], timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      };
      const unsubscribe = this.subscribe((s) => {
        if (s.status === status || s.status === 'offline' || s.status === 'unavailable') done();
      });
      const timer = setTimeout(done, timeoutMs);
    });
  }

  private tick(): void {
    if (shouldAutoCheck(this.state, Date.now())) void this.check();
  }

  private set(patch: Partial<UpdateState>): void {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private emit(): void {
    for (const l of this.listeners) l(this.state);
  }
}

export const updates = new UpdateManager();
