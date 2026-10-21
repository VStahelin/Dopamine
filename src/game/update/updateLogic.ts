/**
 * Regras do gestor de atualização (docs/atualizacoes.md, decisão 0016), sem tocar em rede nem
 * em service worker, para serem testadas.
 */

export type UpdateStatus =
  /** Mesma build do servidor. */
  | 'upToDate'
  | 'checking'
  /** Build nova encontrada; o service worker está baixando a build inteira. */
  | 'downloading'
  /** Build nova inteira no aparelho, esperando o jogador aceitar. */
  | 'ready'
  /** Sem internet: segue na versão que tem. */
  | 'offline'
  /** Sem service worker ou sem version.json (modo de desenvolvimento). */
  | 'unavailable';

export interface UpdateState {
  status: UpdateStatus;
  currentBuild: string;
  currentVersion: string;
  remoteBuild?: string;
  remoteVersion?: string;
  /** Momento da última verificação, em ms. */
  lastCheck: number;
  /** O jogador está nos menus (hub e telas abertas por ele), não numa run. */
  inMenu: boolean;
  /** O aviso já apareceu nesta visita ao hub (DEPOIS fecha até a próxima entrada). */
  promptedThisVisit: boolean;
}

export interface RemoteVersion {
  version: string;
  buildId: string;
}

/** Intervalo da verificação automática nos menus. */
export const CHECK_INTERVAL_MS = 15 * 60 * 1000;

export function initialState(currentVersion: string, currentBuild: string): UpdateState {
  return {
    status: 'upToDate',
    currentBuild,
    currentVersion,
    lastCheck: 0,
    inMenu: false,
    promptedThisVisit: false,
  };
}

/** Verificação automática: só nos menus, e no máximo uma a cada intervalo. */
export function shouldAutoCheck(state: UpdateState, now: number): boolean {
  if (!state.inMenu) return false;
  if (state.status === 'checking' || state.status === 'downloading' || state.status === 'ready') {
    return false;
  }
  return now - state.lastCheck >= CHECK_INTERVAL_MS;
}

/** Resultado do version.json: mesma build, ou build nova para o service worker baixar. */
export function onRemoteVersion(state: UpdateState, remote: RemoteVersion): UpdateState {
  if (remote.buildId === state.currentBuild) {
    return { ...state, status: 'upToDate', remoteBuild: undefined, remoteVersion: undefined };
  }
  return {
    ...state,
    status: state.status === 'ready' ? 'ready' : 'downloading',
    remoteBuild: remote.buildId,
    remoteVersion: remote.version,
  };
}

/** O aviso aparece só nos menus, com a build nova inteira pronta, uma vez por visita ao hub. */
export function shouldPrompt(state: UpdateState): boolean {
  return state.status === 'ready' && state.inMenu && !state.promptedThisVisit;
}

/** Entrar no hub abre uma visita nova (o aviso adiado pode voltar). */
export function enterHub(state: UpdateState): UpdateState {
  return { ...state, inMenu: true, promptedThisVisit: false };
}
