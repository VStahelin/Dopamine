import { damageEnemy } from './combat';
import type { Enemy, RunState } from './state';
import { onHurt } from './supplements';

/**
 * O agente perde `hit` interações (contato, estouro do Peróxido, poça tóxica): Escudo, Esquiva,
 * Membrana, Reflexo, Segunda dose e o fim da run. Dá os quadros de invulnerabilidade.
 */
export function hurtAgent(state: RunState, hit: number, attacker?: Enemy): void {
  const { agent, stats, rules } = state;
  // Modo admin sem dano: nada encosta.
  if (state.admin.god) return;
  agent.invulnerableFor = stats.invulnerabilitySeconds;
  // Escudo antioxidante (Vitamina C): bloqueia o golpe inteiro.
  const sp = state.special;
  if (sp.active > 0 && sp.blocks > 0) {
    sp.blocks--;
    if (sp.blocks === 0) sp.active = 0;
    state.events.push({ type: 'shielded' });
    return;
  }
  if (state.rng.next() < stats.dodge) {
    state.events.push({ type: 'dodge' });
    return;
  }

  const amount = Math.max(rules.run.minDamageTaken, hit - stats.armor);
  agent.interactions = Math.max(0, agent.interactions - amount);
  state.tally.interactionsLost += amount;
  state.events.push({ type: 'hurt', amount, blocked: Math.max(0, hit - amount) });
  onHurt(state);
  // Reflexo: devolve parte do dano a quem encostou.
  if (attacker && stats.thorns > 0) damageEnemy(state, attacker, hit * stats.thorns);

  if (agent.interactions > 0) return;
  // Segunda dose: volta com metade das interações.
  if (state.used.revives < Math.floor(stats.revives)) {
    state.used.revives++;
    agent.interactions = stats.maxInteractions / 2;
    agent.invulnerableFor = rules.run.combat.reviveInvulnerabilitySeconds;
    state.events.push({ type: 'revive' });
    return;
  }
  state.over = true;
}
