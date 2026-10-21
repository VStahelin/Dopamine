/**
 * Ponto único de acesso à configuração (decisão 0004). Os valores ficam nos JSON desta pasta;
 * a anotação de tipo em cada constante faz o build falhar se um JSON sair do formato.
 */
import displayJson from './display.json';
import economyJson from './economy.json';
import idleJson from './idle.json';
import runJson from './run.json';
import statsJson from './stats.json';
import type { DisplayConfig, EconomyConfig, IdleConfig, RunConfig, StatsConfig } from './types';

export type * from './types';

export const STATS: StatsConfig = statsJson;
export const RUN: RunConfig = runJson;
export const ECONOMY: EconomyConfig = economyJson;
export const IDLE: IdleConfig = idleJson;
export const DISPLAY: DisplayConfig = displayJson;
