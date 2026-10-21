import { registerSW } from 'virtual:pwa-register';
import { flushSave } from '../storage/saveStore';
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

  /** ATUALIZAR: grava o save, ativa a build nova e recarrega. */
  async apply(): Promise<void> {
    if (this.state.status !== 'ready' || !this.activate) return;
    await flushSave();
    await this.activate(true);
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
