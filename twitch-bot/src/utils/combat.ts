export interface Combatant {
  name: string;
  class: 'Guerrero' | 'Pícaro' | 'Mago' | 'Mob';
  hp: number;
  maxHp: number;
  fuerza: number;
  destreza: number;
  inteligencia: number;
  defense: number;
  spDefense: number;
  critMultiplier: number;
  emoji?: string;
}

interface ICombatResult {
  winnerName: string;
  battleLog: string[];
}

export function simulateCombat(p1: Combatant, p2: Combatant): ICombatResult {
  const battleLog: string[] = [];

  // Asignamos vida actual a variables mutables para el bucle
  let hp1 = p1.maxHp;
  let hp2 = p2.maxHp;

  // Estados alterados (Quemadura: guarda cuántos turnos le quedan de daño)
  let burnTicksP1 = 0;
  let burnTicksP2 = 0;

  // Determinar iniciativa base según Destreza
  let p1Turn = p1.destreza >= p2.destreza;

  const name1 = p1.class === 'Mob' ? `${p1.emoji} ${p1.name}` : `@${p1.name}`;
  const name2 = p2.class === 'Mob' ? `${p2.emoji} ${p2.name}` : `@${p2.name}`;

  battleLog.push(
    `⚔️ ¡Comienza la batalla entre ${name1} (HP: ${hp1}) y ${name2} (HP: ${hp2})!`,
  );

  let rounds = 0;
  while (hp1 > 0 && hp2 > 0 && rounds < 30) {
    rounds++;

    // Definimos quién ataca y quién defiende en este turno exacto
    let attacker = p1Turn ? p1 : p2;
    let defender = p1Turn ? p2 : p1;
    let atkHp = p1Turn ? hp1 : hp2;
    let defHp = p1Turn ? hp2 : hp1;

    let atkName = p1Turn ? name1 : name2;
    let defName = p1Turn ? name2 : name1;

    // ==========================================
    // 🧪 FASE INTERNA: DAÑO POR QUEMADURA (Al inicio del turno del atacante)
    // ==========================================
    if (p1Turn && burnTicksP1 > 0) {
      const burnDamage = Math.floor(p1.maxHp * 0.1);
      hp1 -= burnDamage;
      battleLog.push(
        `🔥 ¡La quemadura afecta a ${name1} infligiendo **${burnDamage}** de daño continuo! (HP: ${Math.max(0, hp1)})`,
      );
      burnTicksP1--;
      if (hp1 <= 0) break;
    } else if (!p1Turn && burnTicksP2 > 0) {
      const burnDamage = Math.floor(p2.maxHp * 0.1);
      hp2 -= burnDamage;
      battleLog.push(
        `🔥 ¡La quemadura afecta a ${name2} infligiendo **${burnDamage}** de daño continuo! (HP: ${Math.max(0, hp2)})`,
      );
      burnTicksP2--;
      if (hp2 <= 0) break;
    }

    // ==========================================
    // 🤺 FASE DE ATAQUE
    // ==========================================
    let baseDamage = 5;
    if (attacker.class === 'Guerrero') baseDamage = attacker.fuerza;
    else if (attacker.class === 'Pícaro') baseDamage = attacker.destreza;
    else if (attacker.class === 'Mago') baseDamage = attacker.inteligencia;
    else if (attacker.class === 'Mob') baseDamage = attacker.fuerza; // Mobs escalan con fuerza base

    // Variación de daño (+/- 20%)
    const varAmt = baseDamage * 0.2;
    let hitDamage = Math.floor(
      baseDamage - varAmt + Math.random() * (varAmt * 2),
    );
    hitDamage = Math.max(1, hitDamage);

    // --- TRAIT: PÍCARO (CRÍTICO) ---
    let isCrit = false;
    if (attacker.class === 'Pícaro') {
      const critChance = Math.min(0.5, attacker.destreza / 250);
      if (Math.random() < critChance) {
        isCrit = true;
        hitDamage = Math.floor(hitDamage * attacker.critMultiplier);
      }
    }

    // --- MITIGACIÓN DE ARMADURA ---
    const defTotal = defender.defense + defender.spDefense;
    let finalDamage = Math.max(5, hitDamage - defTotal);

    // --- TRAIT: GUERRERO (BLOQUEO) ---
    let blocked = false;
    if (defender.class === 'Guerrero') {
      const blockChance = Math.min(0.45, defender.defense / 150);
      if (Math.random() < blockChance) {
        blocked = true;
        finalDamage = Math.floor(finalDamage * 0.2); // Mitiga el 80%
      }
    }

    // Aplicar daño final al defensor
    if (p1Turn) hp2 -= finalDamage;
    else hp1 -= finalDamage;
    defHp = p1Turn ? hp2 : hp1;

    // Registrar acción en el log
    if (blocked) {
      battleLog.push(
        `🛡️ ¡BLOQUEO! ${defName} alza su escudo, mitigando el golpe de ${atkName} y recibe solo *${finalDamage}* de daño. (HP: ${Math.max(0, defHp)})`,
      );
    } else if (isCrit) {
      battleLog.push(
        `⚡ ¡GOLPE CRÍTICO! ${atkName} encuentra un punto débil y revienta a ${defName} por *${finalDamage}* de daño. (HP: ${Math.max(0, defHp)})`,
      );
    } else if (attacker.class === 'Mago') {
      battleLog.push(
        `🔮 ${atkName} lanza una Bola de Fuego a ${defName} causando *${finalDamage}* de daño. (HP: ${Math.max(0, defHp)})`,
      );
    } else {
      battleLog.push(
        `🤺 ${atkName} ataca a ${defName} infligiendo *${finalDamage}* de daño. (HP: ${Math.max(0, defHp)})`,
      );
    }

    // --- TRAIT: MAGO (QUEMAR - 10% DE CHANCE) ---
    if (attacker.class === 'Mago' && defHp > 0) {
      if (Math.random() < 0.1) {
        // 10% de probabilidad fija
        if (p1Turn) {
          burnTicksP2 = 3; // Quema por los próximos 3 turnos del defensor
        } else {
          burnTicksP1 = 3;
        }
        battleLog.push(
          `🔥 ¡${defName} ha sido ENVUELTO EN LLAMAS por la magia de ${atkName}!`,
        );
      }
    }

    // Cambiar de turno
    p1Turn = !p1Turn;
  }

  const winnerName = hp1 > 0 ? p1.name : p2.name;
  return { winnerName, battleLog };
}
