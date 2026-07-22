import 'dotenv/config';
import { StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import mongoose from 'mongoose';
import { Hero, HeroClass } from './models/Hero.js';
import { ITEM_DATABASE } from './config/items.js';
import { Combatant, simulateCombat } from './utils/combat.js';
import { AUTOMATIC_MESSAGES } from './config/timers.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:5050',
      'http://127.0.0.1:5050',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
  });
});

const COOLDOWN_TIEMPO = 30 * 1000; // 30 segundos en milisegundos
let ultimoSonidoDisparado = 0;

// Agregado de sonidos al Bot
const SOUND_COMMANDS: Record<
  string,
  { sound: string; image: string; message: (user: string) => string }
> = {
  '!rickroll': {
    sound: 'rickroll.mp3',
    image: 'rickroll.gif',
    message: (user) =>
      `🎶 ¡@${user} acaba de rickrollear al stream! Never Gonna Give You Up...`,
  },
};

interface IDuelChallenge {
  challenger: string;
  target: string;
  createdAt: Date;
}

interface IMob {
  name: string;
  emoji: string;
  level: number;
  hp: number;
  atk: number;
  goldReward: number;
  expReward: number;
  lootPool: string[]; // IDs de items que puede dropear
}

const activeDuels = new Map<string, IDuelChallenge>();
let activeMob: IMob | null = null;

const MOB_TEMPLATES = [
  {
    name: 'Goblin Saqueador',
    emoji: '👺',
    lootPool: ['espada_hierro', 'dagas_venenosas', 'baculo_cristal'],
  },
  {
    name: 'Orco Enfurecido',
    emoji: '👹',
    lootPool: ['hacha_batalla', 'jubon_tachonado', 'armadura_placas'],
  },
  {
    name: 'Esqueleto Guardián',
    emoji: '💀',
    lootPool: ['garras_sombra', 'libro_hechizos', 'tunica_archimago'],
  },
];

// Variable para almacenar el temporizador del bicho actual
let mobDespawnTimer: NodeJS.Timeout | null = null;

async function spawnRandomMob(
  chatClient: ChatClient,
  channel: string,
): Promise<void> {
  if (activeMob) {
    chatClient.say(
      channel,
      `🚨 El ${activeMob.emoji} *${activeMob.name}* [Nv.${activeMob.level}] sigue aterrorizando al chat (HP: ${activeMob.hp}). ¡Escribe !atacar para enfrentarlo! ⚔️`,
    );
    return;
  }

  try {
    // 1. Buscamos en la DB los héroes que ya eligieron clase para promediar su nivel
    const heroesActivos = await Hero.find({ class: { $ne: 'Campesino' } });

    let nivelBase = 1;
    if (heroesActivos.length > 0) {
      const sumaNiveles = heroesActivos.reduce((acc, h) => acc + h.level, 0);
      nivelBase = Math.round(sumaNiveles / heroesActivos.length);
    }

    // 2. Definimos el nivel del Mob: El promedio del chat +/- 2 niveles (Mínimo nivel 1, máximo 30)
    const variacionNivel = Math.floor(Math.random() * 5) - 2; // Da entre -2 y +2
    const mobLevel = Math.max(1, Math.min(30, nivelBase + variacionNivel));

    const template =
      MOB_TEMPLATES[Math.floor(Math.random() * MOB_TEMPLATES.length)];

    activeMob = {
      name: template.name,
      emoji: template.emoji,
      level: mobLevel,
      hp: mobLevel * 50,
      atk: mobLevel * 6,
      goldReward: mobLevel * 15,
      expReward: mobLevel * 30,
      lootPool: template.lootPool,
    };

    console.log(activeMob);

    chatClient.say(
      channel,
      `🚨 ¡UN ENEMIGO HA APARECIDO! ${activeMob.emoji} *${activeMob.name}* [Nv.${activeMob.level}] está atacando el chat (HP: ${activeMob.hp}). ¡Escribe !atacar para enfrentarlo y reclamar su botín! ⚔️`,
    );

    // 4. CONFIGURAR DESPAWN: Si en 5 minutos (300.000 ms) nadie lo mató, se va
    mobDespawnTimer = setTimeout(
      () => {
        if (activeMob) {
          chatClient.say(
            channel,
            `💨 El ${activeMob.emoji} *${activeMob.name}* [Nv.${activeMob.level}] se aburrió de esperar y huyó del chat hacia el bosque.`,
          );
          activeMob = null; // Liberamos el slot
        }
      },
      5 * 60 * 1000,
    );
  } catch (err) {
    console.error(err);
  }
}

const TIMER_INTERVAL = 10 * 60 * 1000;
//const MIN_CHAT_LINES = 5;

let messageIndex = 0;
let chatLinesCounter = 0;

function startAutomaticTimers(chatClient: ChatClient, channel: string): void {
  setInterval(() => {
    // if (chatLinesCounter < MIN_CHAT_LINES) return;

    const message = AUTOMATIC_MESSAGES[messageIndex];

    chatClient.say(channel, message);

    messageIndex = (messageIndex + 1) % AUTOMATIC_MESSAGES.length;
    chatLinesCounter = 0;
  }, TIMER_INTERVAL);
}

async function main(): Promise<void> {
  const clientId = process.env.CLIENT_ID;
  const accessToken = process.env.TWITCH_ACCESS_TOKEN;
  const channel = process.env.TWITCH_CHANNEL;
  const botName = process.env.TWITCH_BOT_USERNAME || 'TehPonBot';
  const mongoDbUri = process.env.MONGODB_URI || '';

  if (!clientId || !accessToken || !channel) {
    throw new Error(
      'Faltan configurar variables esenciales en el archivo .env',
    );
  }

  const authProvider = new StaticAuthProvider(clientId, accessToken);

  const chatClient = new ChatClient({
    authProvider,
    channels: [channel],
  });

  chatClient.onConnect(() => {
    console.log(`[${botName}] Conectado exitosamente usando TypeScript`);

    const enableAdventure = process.env.RPG_ADVENTURE_ENABLE === 'true';
    if (enableAdventure) {
      const adventureTimer = parseInt(process.env.RPG_ADVENTURE_TIMER!);
      setInterval(
        () => {
          spawnRandomMob(chatClient, process.env.TWITCH_CHANNEL!);
        },
        adventureTimer * 60 * 1000,
      );
    }

    startAutomaticTimers(chatClient, process.env.TWITCH_CHANNEL!);
  });

  chatClient.onMessage(async (channel, user, text, message) => {
    const args = text.trim().split(' ');
    const command = args[0].toLowerCase();
    const lowercaseUser = user.toLowerCase();

    if (!command.startsWith('!')) {
      chatLinesCounter++;
      return;
    }

    if (command === '!ping') {
      chatClient.say(channel, `Pong!`);
      console.log(`${user} llamo al comando !ping`);
      return;
    }

    if (command === '!aventura') {
      try {
        let hero = await Hero.findOne({ username: lowercaseUser });

        if (!hero) {
          hero = new Hero({ username: lowercaseUser, state: 'choosing_class' });
          await hero.save();

          chatClient.say(
            channel,
            `⚔️ ¡@${user} bienvenido al reino! Tu perfil ha sido creado. Para empezar tu viaje, elige una clase escribiendo: !clase [Guerrero / Mago / Pícaro]`,
          );
          return;
        }

        if (hero.class === 'Campesino') {
          chatClient.say(
            channel,
            `⚠️ @${user}, aún no elegiste tu clase. Escribe !clase [Guerrero / Mago / Picaro] para empezar.`,
          );

          return;
        }

        const weapon = ITEM_DATABASE[hero.inventory.weapon];
        const armor = ITEM_DATABASE[hero.inventory.armor];
        chatClient.say(
          channel,
          `🎒 Héroe @${user} [${hero.class} Nv.${hero.level}] 🌟 EXP: ${hero.exp} | 🪙 Oro: ${hero.gold} | ⚔️ Arma: ${weapon.name} | 🛡️ Armadura: ${armor.name}`,
        );
      } catch (error) {
        console.error(error);
        chatClient.say(
          channel,
          `❌ Ocurrió un error en la Matrix al cargar tu aventura.`,
        );
      }
      return;
    }

    if (command === '!stats') {
      try {
        const hero = await Hero.findOne({ username: lowercaseUser });
        if (!hero) {
          chatClient.say(
            channel,
            `❌ @${user}, no tenés un heroe creado en este reino. Usá !aventura para iniciar.`,
          );
          return;
        }

        if (hero.class === 'Campesino') {
          chatClient.say(
            channel,
            `⚠️ @${user}, aún no elegiste tu clase. Escribe !clase [Guerrero / Mago / Picaro] para empezar.`,
          );

          return;
        }

        const stats = (hero as any).stats;

        chatClient.say(
          channel,
          `🎒 Héroe @${user} [${hero.class} Nv.${hero.level}] tus stats son: 🌟 Fuerza: ${stats.fuerza} | 🌟 Vitalidad: ${stats.vitalidad} | 🌟 Destreza: ${stats.destreza} | 🌟 inteligencia: ${stats.inteligencia} | 🌟 Defensa: ${stats.defense} | 🌟 Defensa Especial: ${stats.spDefense} | 🌟 HP: ${stats.maxHp} |`,
        );
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (command === '!gold') {
      try {
        const hero = await Hero.findOne({ username: lowercaseUser });
        if (!hero) {
          chatClient.say(
            channel,
            `❌ @${user}, no tenés un heroe creado en este reino. Usá !aventura para iniciar.`,
          );
          return;
        }

        if (hero.class === 'Campesino') {
          chatClient.say(
            channel,
            `⚠️ @${user}, aún no elegiste tu clase. Escribe !clase [Guerrero / Mago / Picaro] para empezar.`,
          );

          return;
        }

        chatClient.say(
          channel,
          `🎒 Héroe @${user} [${hero.class} Nv.${hero.level}] tu 🪙 Oro total es:  ${hero.gold}`,
        );
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (command === '!clase') {
      let inputClass = args[1].toLowerCase();

      if (inputClass === 'picaro') {
        inputClass = 'pícaro';
      }

      let selectedClass =
        inputClass?.charAt(0).toUpperCase() +
        inputClass?.slice(1).toLocaleLowerCase();
      const validClasses: HeroClass[] = ['Guerrero', 'Mago', 'Pícaro'];

      // El flujo sigue como antes
      if (
        !selectedClass ||
        !validClasses.includes(selectedClass as HeroClass)
      ) {
        chatClient.say(
          channel,
          `❌ @${user}, debes especificar una clase válida: !clase Guerrero, !clase Mago o !clase Pícaro.`,
        );
        return;
      }

      try {
        let hero = await Hero.findOne({ username: lowercaseUser });

        if (!hero) {
          chatClient.say(
            channel,
            `❌ @${user}, no tenés un heroe creado en este reino. Usá !aventura para iniciar.`,
          );
          return;
        }

        const isResetting = hero.class !== 'Campesino';

        hero.class = selectedClass as HeroClass;
        hero.level = 1;
        hero.exp = 0;
        hero.gold = 10;
        hero.state = 'idle';

        if (selectedClass === 'Guerrero') {
          hero.inventory = {
            weapon: 'espada_madera', // Items default de clase
            armor: 'escudo_cuero', // Items default de clase
          };
        } else if (selectedClass === 'Mago') {
          hero.inventory = {
            weapon: 'baculo_gastado', // Items default de clase
            armor: 'tunica_aprendiz', // Items default de clase
          };
        } else if (selectedClass === 'Pícaro') {
          hero.inventory = {
            weapon: 'dagas_hierro', // Items default de clase
            armor: 'capa_sombras', // Items default de clase
          };
        }

        await hero.save();

        if (isResetting) {
          chatClient.say(
            channel,
            `🔄 ¡Cambio de destino! @${user} ha reiniciado su progreso y ahora es un *${selectedClass}* de Nivel 1. ¡Tu inventario fue restaurado! 🎒`,
          );
        } else {
          chatClient.say(
            channel,
            `✨ ¡Excelente elección @${user}! Te has convertido en *${selectedClass}*. Tu aventura comienza oficialmente AHORA. Escribe !aventura para ver tu estado.`,
          );
        }
      } catch (error) {
        console.error(error);
        chatClient.say(
          channel,
          `❌ Ocurrió un error al querer modificar tu clase!.`,
        );
      }

      return;
    }

    if (command === '!duelo') {
      const targetUser = args[1]?.toLowerCase().replace('@', '');

      if (!targetUser) {
        chatClient.say(
          channel,
          `❌ @${user}, debes especificar a quién desafiar. Ej: !duelo user123`,
        );
        return;
      }

      if (targetUser === lowercaseUser) {
        chatClient.say(
          channel,
          `🤣 @${user}, no podés batirte a duelo con vos mismo.`,
        );
        return;
      }

      try {
        const challengerHero = await Hero.findOne({ username: lowercaseUser });
        const targetHero = await Hero.findOne({ username: targetUser });

        if (!challengerHero || challengerHero.class === 'Campesino') {
          chatClient.say(
            channel,
            `❌ @${user}, necesitás iniciar tu aventura primero con !aventura.`,
          );
          return;
        }

        if (!targetHero || targetHero.class === 'Campesino') {
          chatClient.say(
            channel,
            `❌ El usuario @${targetUser} aún no es un héroe en este reino.`,
          );
          return;
        }

        const lvlDifference = Math.abs(challengerHero.level - targetHero.level);
        if (lvlDifference > 3) {
          chatClient.say(
            channel,
            `🛡️ ¡Duelo denegado! La diferencia de nivel es de ${lvlDifference}. Las peleas deben ser justas (+/- 3 niveles de diferencia).`,
          );
          return;
        }

        activeDuels.set(targetUser, {
          challenger: lowercaseUser,
          target: targetUser,
          createdAt: new Date(),
        });

        chatClient.say(
          channel,
          `⚔️ @${user} [Nv.${challengerHero.level}] ha desafiado a un duelo a @${targetUser} [Nv.${targetHero.level}]. Escribe !aceptar en los próximos 60s para pelear.`,
        );
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (command === '!aceptar') {
      const pendingDuel = activeDuels.get(lowercaseUser);

      if (!pendingDuel) {
        chatClient.say(
          channel,
          `❌ @${user}, no tenés ningún desafío de duelo pendiente.`,
        );
        return;
      }

      const timePassed =
        (new Date().getTime() - pendingDuel.createdAt.getTime()) / 1000;
      if (timePassed > 60) {
        activeDuels.delete(lowercaseUser);
        chatClient.say(
          channel,
          `⏱️ El duelo pendiente para @${user} ha expirado.`,
        );
        return;
      }

      try {
        const challenger = await Hero.findOne({
          username: pendingDuel.challenger,
        });
        const target = await Hero.findOne({ username: pendingDuel.target });

        if (!challenger || !target) return;

        const p1: Combatant = {
          name: challenger.username,
          class: challenger.class as any,
          hp: (challenger as any).stats.maxHp,
          maxHp: (challenger as any).stats.maxHp,
          ...(challenger as any).stats,
        };

        const p2: Combatant = {
          name: target.username,
          class: target.class as any,
          hp: (target as any).stats.maxHp,
          maxHp: (target as any).stats.maxHp,
          ...(target as any).stats,
        };

        const resultadoDuelo = simulateCombat(p1, p2);
        console.log(resultadoDuelo.battleLog);
        const ganador =
          resultadoDuelo.winnerName == challenger.username
            ? challenger
            : target;
        const perdedor =
          ganador.username === challenger.username ? target : challenger;

        const oroRobado = Math.floor(perdedor.gold * 0.15);
        const expGanada = 25 * perdedor.level;

        ganador.gold += oroRobado;
        ganador.exp += expGanada;
        perdedor.gold -= oroRobado;

        const expNecesaria = ganador.level * 100;
        let subioNivel = false;

        if (ganador.exp >= expNecesaria && ganador.level < 30) {
          ganador.level += 1;
          ganador.exp = 0;
          subioNivel = true;
        }

        await ganador.save();
        await perdedor.save();

        activeDuels.delete(lowercaseUser);

        let resultadoMsg = `💥 ¡Duelo finalizado! El ganador es @${ganador.username}. Se lleva 🪙 ${oroRobado} de oro y 🌟 ${expGanada} de EXP.`;
        if (subioNivel) {
          resultadoMsg += ` 🎉 ¡¡@${ganador.username} SUBIÓ AL NIVEL ${ganador.level}!!`;
        }

        chatClient.say(channel, resultadoMsg);
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (command === '!atacar') {
      if (!activeMob) {
        chatClient.say(
          channel,
          `🛡️ @${user}, la zona está tranquila. No hay monstruos acechando en este momento.`,
        );
        return;
      }

      try {
        const hero = await Hero.findOne({ username: lowercaseUser });
        if (!hero) {
          chatClient.say(
            channel,
            `❌ @${user}, necesitás iniciar tu aventura con !aventura para poder combatir.`,
          );
          return;
        }

        const stats = (hero as any).stats;

        const playerCombatant: Combatant = {
          name: hero.username,
          class: hero.class as any,
          hp: stats.maxHp,
          maxHp: stats.maxHp,
          ...stats, // Esparce fuerza, destreza, inteligencia, etc.
        };

        const mobCombatant: Combatant = {
          name: activeMob.name,
          class: 'Mob',
          hp: activeMob.hp,
          maxHp: activeMob.hp,
          fuerza: activeMob.atk, // El mob usa su atk base como fuerza
          destreza: activeMob.level * 3, // Iniciativa proporcional a su nivel
          inteligencia: 0,
          defense: activeMob.level * 2,
          spDefense: activeMob.level * 2,
          critMultiplier: 1,
          emoji: activeMob.emoji,
        };

        const resultado = simulateCombat(playerCombatant, mobCombatant);
        console.log(resultado.battleLog);
        const playerWon = resultado.winnerName === hero.username;

        if (playerWon) {
          let recompensaMsg = `⚔️ @${user} ha derrotado a ${activeMob.emoji} *${activeMob.name}*! Ganó 🪙 ${activeMob.goldReward} de oro y 🌟 ${activeMob.expReward} de EXP.`;

          hero.gold += activeMob.goldReward;
          hero.exp += activeMob.expReward;

          if (Math.random() < 0.35) {
            const posiblesDrops = activeMob.lootPool.filter(
              (id) => ITEM_DATABASE[id].exclusiveClass === hero.class,
            );

            if (posiblesDrops.length > 0) {
              const itemDropeadoId =
                posiblesDrops[Math.floor(Math.random() * posiblesDrops.length)];

              const itemData = ITEM_DATABASE[itemDropeadoId];

              if (itemData.type === 'weapon') {
                hero.inventory.weapon = itemData.id;
              }

              if (itemData.type === 'armor') {
                hero.inventory.armor = itemData.id;
              }

              recompensaMsg += ` 🎁 ¡DROP ÉPICO! Encontraste: *${itemData.name}* y te lo equipaste automáticamente.`;
            }
          }

          if (hero.exp >= hero.level * 100 && hero.level < 30) {
            hero.level += 1;
            hero.exp = 0;
            recompensaMsg += ` 🎉 ¡SUBISTE AL NIVEL ${hero.level}!`;
          }

          console.log(`${activeMob.name} fue derrotado.`);
          await hero.save();

          if (mobDespawnTimer) {
            clearTimeout(mobDespawnTimer);
            mobDespawnTimer = null;
          }
          activeMob = null;
          chatClient.say(channel, recompensaMsg);
        } else {
          const oroPerdido = Math.floor(hero.gold * 0.05);
          hero.gold -= oroPerdido;
          await hero.save();

          chatClient.say(
            channel,
            `💀 @${user} fue derrotado brutalmente por el ${activeMob.name}. El monstruo sigue libre y perdiste 🪙 ${oroPerdido} de oro por la paliza.`,
          );
        }
      } catch (err) {
        console.error(err);
      }

      return;
    }

    if (command === '!mob') {
      if (!activeMob) {
        chatClient.say(
          channel,
          `🛡️ @${user}, la zona está tranquila. No hay monstruos acechando en este momento.`,
        );
        return;
      }

      chatClient.say(
        channel,
        `🚨 El mob activo es un ${activeMob.emoji} *${activeMob.name}* [Nv.${activeMob.level}] (HP: ${activeMob.hp}). ¡Escribe !atacar para enfrentarlo! ⚔️`,
      );

      return;
    }

    if (command === '!rickroll') {
      const ahora = Date.now();
      const tiempoPasado = ahora - ultimoSonidoDisparado;

      // Verificamos si todavía estamos dentro del tiempo de espera
      if (tiempoPasado < COOLDOWN_TIEMPO) {
        const segundosRestantes = Math.ceil(
          (COOLDOWN_TIEMPO - tiempoPasado) / 1000,
        );

        chatClient.say(
          channel,
          `⏳ @${user}, el sistema de audio está en enfriamiento. Faltan ${segundosRestantes} segundos para poder volver a mandar otro audio.`,
        );
        return; // Frenamos la ejecución para que no suene nada
      }

      const alert = SOUND_COMMANDS[command];
      const { sound, image, message } = alert;

      io.emit('trigger-alert', {
        sound,
        image,
        message: message(user),
      });

      chatClient.say(channel, message(user));

      ultimoSonidoDisparado = Date.now();
    }
  });

  mongoose
    .connect(mongoDbUri)
    .then(() => {
      console.log('Conectado a MongoDB');
    })
    .catch((err) => {
      console.error('Error al conectar a MongoDB:', err);
    });

  await chatClient.connect();
}

main().catch(console.error);

const PORT = 5051;
httpServer.listen(PORT, () => {
  console.log(`Servidor de sockets corriendo en: http://localhost:${PORT}`);
});
