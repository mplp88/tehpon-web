import 'dotenv/config';
import mongoose from 'mongoose';
import { ApiClient } from '@twurple/api';
import { StaticAuthProvider } from '@twurple/auth';
import { ChatClient } from '@twurple/chat';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { Hero, HeroClass } from './models/Hero.js';
import { ITEM_DATABASE } from './config/items.js';
import { Combatant, simulateCombat } from './utils/combat.js';
import { AUTOMATIC_MESSAGES } from './config/timers.js';
import { CommandManager } from './services/CommandManager.js';
import { registerAttendance } from './services/RegisterAttendance.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const API_URL = process.env.API_URL || 'http://localhost:3000';
const commandManager = new CommandManager(API_URL);

// const httpServer = createServer();

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

const LURK_COOLDOWN = 3 * 60 * 1000; // 3 minutos

const lurkResponses = [
  '👀 ¡Gracias por el lurk, @USER! Si vas a silenciar el stream, mejor muteá la pestaña del navegador y no el reproductor de Twitch 💜',
  '🫡 ¡Lurk recibido, @USER! Recordatorio: si querés silencio, silenciá la pestaña del navegador en vez del reproductor de Twitch 😉',
  '👋 ¡Gracias por dejar el lurk, @USER! Y recuerden: para lurkear en silencio, mejor silenciar la pestaña y no el reproductor de Twitch.',
];

let lastLurkResponseIndex = -1;
let lastLurkResponseAt = 0;

function normalizeMessage(message: string) {
  return message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isLurkIntent(message: string) {
  const text = normalizeMessage(message);

  // Preguntas o conversaciones sobre el concepto de lurk.
  const excludedPatterns = [
    /\bque es\b.*\blurk\b/,
    /\bque significa\b.*\blurk\b/,
    /\bcomo funciona\b.*\blurk\b/,
    /\blurkers?\b.*\bcuentan\b/,
    /\bcuentan\b.*\blurkers?\b/,
  ];

  if (excludedPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  // Frases que indican claramente que está dejando un lurk.
  const lurkPatterns = [
    /\bte dejo (un )?lurk\b/,
    /\bles dejo (un )?lurk\b/,
    /\bdejo (mi )?lurk\b/,
    /\bme voy\b.*\blurk\b/,
    /\bme tengo que ir\b.*\blurk\b/,
    /\bme retiro\b.*\blurk\b/,
    /\bme desconecto\b.*\blurk\b/,
    /\bvoy a lurkear\b/,
    /\bvoy a estar lurkeando\b/,
    /\bme quedo lurkeando\b/,
    /\bme quedo de lurk\b/,
    /\blurk\b/,
  ];

  return lurkPatterns.some((pattern) => pattern.test(text));
}

function getLurkResponse(username: string) {
  const now = Date.now();

  // Cooldown
  if (now - lastLurkResponseAt < LURK_COOLDOWN) {
    return null;
  }

  // Elegir una respuesta distinta a la anterior
  let index;

  do {
    index = Math.floor(Math.random() * lurkResponses.length);
  } while (lurkResponses.length > 1 && index === lastLurkResponseIndex);

  lastLurkResponseIndex = index;
  lastLurkResponseAt = now;

  return lurkResponses[index].replace('@USER', `@${username}`);
}

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

const TIMER_INTERVAL = Number(process.env.MESSAGES_TIMER_INTERVAL) * 60 * 1000;
const MIN_CHAT_LINES = Number(process.env.MESSAGES_MIN_CHAT_LINES);

let messageIndex = 0;
let chatLinesCounter = 0;

function startAutomaticTimers(chatClient: ChatClient, channel: string): void {
  setInterval(() => {
    if (
      MIN_CHAT_LINES &&
      MIN_CHAT_LINES > 0 &&
      chatLinesCounter < MIN_CHAT_LINES
    )
      return;

    const message = AUTOMATIC_MESSAGES[messageIndex];

    chatClient.say(channel, message);

    messageIndex = (messageIndex + 1) % AUTOMATIC_MESSAGES.length;
    chatLinesCounter = 0;
  }, TIMER_INTERVAL);
}

const clipsDir = path.join('D:', 'Twitch', 'ShoutoutClips');

async function downloadClip(clipUrl: string, filePath: string) {
  console.log(`Descargando clip mediante yt-dlp...`);
  console.log(`URL: ${clipUrl}`);
  console.log(`Destino: ${filePath}`);

  try {
    const { stdout, stderr } = await execFileAsync(
      'yt-dlp',
      [
        '--no-playlist',
        '--no-part',
        '-f',
        'best[ext=mp4]/best',
        '-o',
        filePath,
        clipUrl,
      ],
      {
        windowsHide: true,
      },
    );

    if (stdout) {
      console.log(stdout);
    }

    if (stderr) {
      console.log(stderr);
    }

    console.log(`yt-dlp terminó correctamente.`);
  } catch (error: any) {
    console.error('Error ejecutando yt-dlp:');

    if (error.stdout) {
      console.error(error.stdout);
    }

    if (error.stderr) {
      console.error(error.stderr);
    }

    throw error;
  }
}

async function downloadFile(url: string, targetPath: string) {
  const writer = fs.createWriteStream(targetPath);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
    response.data.on('error', reject);
  });
}

const maxAgeMs = Number(process.env.CLIPS_CACHE_DAYS) * 24 * 60 * 60 * 1000;

function cleanOldClips() {
  if (!fs.existsSync(clipsDir)) {
    return;
  }

  const now = Date.now();

  for (const file of fs.readdirSync(clipsDir)) {
    if (!file.endsWith('.mp4')) {
      continue;
    }

    const filePath = path.join(clipsDir, file);
    const stats = fs.statSync(filePath);

    const age = now - stats.mtimeMs;

    if (age > maxAgeMs) {
      fs.unlinkSync(filePath);

      console.log(`Clip antiguo eliminado: ${file}`);
    }
  }
}

async function main(): Promise<void> {
  cleanOldClips();

  // (Opcional) Refrescar la caché cada 10 minutos por si agregás un comando desde la web
  setInterval(
    () => {
      commandManager.loadCommands();
    },
    10 * 60 * 1000,
  );

  const clientId = process.env.TWITCH_CLIENT_ID;
  const accessToken = process.env.TWITCH_ACCESS_TOKEN;
  const botToken = process.env.TWITCH_ACCESS_TOKEN_BOT;
  const channel = process.env.TWITCH_CHANNEL!;
  const botName = process.env.TWITCH_BOT_USERNAME || 'TehPonBot';
  const mongoDbUri = process.env.MONGODB_URI || '';

  if (!clientId || !accessToken || !botToken || !channel) {
    throw new Error(
      'Faltan configurar variables esenciales en el archivo .env',
    );
  }

  // Bot auth for chat
  const botAuthProvider = new StaticAuthProvider(clientId, botToken);
  const chatClient = new ChatClient({
    authProvider: botAuthProvider,
    channels: [channel],
    requestMembershipEvents: true,
  });

  // Streamer auth for redemptions
  const streamerAuthProvider = new StaticAuthProvider(clientId, accessToken);
  const userApiClient = new ApiClient({ authProvider: streamerAuthProvider });
  const listener = new EventSubWsListener({ apiClient: userApiClient });
  const streamerId = (await userApiClient.getTokenInfo()).userId + '';

  listener.onChannelRedemptionAdd(streamerId, async (event) => {
    const { rewardTitle, userId, userDisplayName, input } = event;
    console.log(`${userDisplayName} canjeó: ${rewardTitle}`);
    console.log(`Mensaje: ${input}`);

    const normalizedRewardTitle = rewardTitle.toLowerCase();

    if (normalizedRewardTitle === '[insert coin]') {
      const data = await registerAttendance(userId, userDisplayName);

      if (!data) return;

      const { totalCheckIns, isNewCheckIn } = data;
      let message = `¡${userDisplayName} se unió a la partida `;
      message += isNewCheckIn
        ? `por primera vez! Que disfrutes de gameplay.`
        : `nuevamente! Creditos disponibles: ${totalCheckIns}.`;

      chatClient.say(channel, message);

      const overlayMessage = `¡${userDisplayName} se unió a la partida!`;

      axios.post('http://localhost:5050/api/overlay/alert', {
        message: overlayMessage,
        username: userDisplayName,
        isTts: false,
        image: 'arcade-coin.gif',
        sound: 'insert-coin.wav',
      });

      return;
    }

    if (normalizedRewardTitle === 'tts') {
      if (!input) {
        // Opcional: podrías responderle en el chat de Twitch que falta el texto
        chatClient.say(
          channel,
          `⚠️ @${userDisplayName}, para usar el comando tts tenés que escribir el texto '!tts <texto>' (sin los <> 😅)`,
        );
        console.log(`@${userDisplayName} no envió texto para el TTS.`);
        return;
      }

      // Sanitizamos o limitamos la longitud para evitar spam/abuso de lectura
      const cleanText = `${userDisplayName} dice: ${input.substring(0, 200)}`;

      axios.post('http://localhost:5050/api/overlay/alert', {
        message: cleanText,
        username: userDisplayName,
        isTts: true, // <-- Flag clave para que el Front sepa qué hacer
        image: null, //|| 'tts-default.gif', // Imagen fija o por defecto si querés
        sound: null, // No mandamos archivo de audio
      });

      return;
    }
  });

  listener.start();

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async function sendSystemBootSequence(client: ChatClient, channel: string) {
    const bootSequence = [
      '> SYSTEM_INIT... [OK]',
      '> Daemon running on port 8080.',
      '> Stream process loaded without errors (0 warnings).',
      '¡Sistemas en línea! ☕ Servidor arriba, café caliente y código listo. Agarrate un café y ponete cómodo, que ya arrancamos.',
    ];

    for (const line of bootSequence) {
      client.say(channel, line);
      await sleep(2000);
    }
  }

  const CHATTERS_REFRESH_INTERVAL = 3 * 60 * 1000;
  const chatters = new Set<string>();

  async function refreshChatters() {
    try {
      const newChatters = new Set<string>();

      const { userId } = await userApiClient.getTokenInfo();
      if (!userId) {
        console.log('No se pudo obtener el userId del token');
        return;
      }
      const paginator = userApiClient.chat.getChattersPaginated(userId);

      for await (const chatter of paginator) {
        newChatters.add(chatter.userDisplayName);
      }

      chatters.clear();

      for (const chatter of newChatters) {
        chatters.add(chatter);
      }

      console.log(`[CHATTERS] Cache actualizado: ${chatters.size} usuarios`);
    } catch (error) {
      console.error('[CHATTERS] Error actualizando:', error);
    }
  }

  function getRandomChatter(excludeUser: string) {
    const excluded = new Set([excludeUser, botName]);

    const users = [...chatters].filter((username) => !excluded.has(username));

    if (users.length === 0) {
      return null;
    }

    return users[Math.floor(Math.random() * users.length)];
  }

  chatClient.onJoin((_, user) => {
    console.log(`[CHATTERS] ${user} JOINED (${chatters.size})`);
  });

  chatClient.onPart((_, user) => {
    console.log(`[CHATTERS] ${user} PARTED (${chatters.size})`);
  });

  chatClient.onConnect(() => {
    console.log(`[${botName}] Conectado exitosamente usando TypeScript`);

    setInterval(() => {
      refreshChatters();
    }, CHATTERS_REFRESH_INTERVAL);

    const enableAdventure = process.env.RPG_ADVENTURE_ENABLE === 'true';
    if (enableAdventure) {
      const adventureTimer = parseInt(process.env.RPG_ADVENTURE_TIMER!);
      setInterval(
        () => {
          spawnRandomMob(chatClient, channel);
        },
        adventureTimer * 60 * 1000,
      );
    }

    startAutomaticTimers(chatClient, channel);
    sendSystemBootSequence(chatClient, channel);
  });

  chatClient.onMessage(async (channel, user, text, message) => {
    const args = text.trim().split(' ');
    const command = args[0].toLowerCase();
    const lowercaseUser = user.toLowerCase();
    const { displayName } = message.userInfo;

    if (!chatters.has(displayName)) {
      chatters.add(displayName);
    }

    if (message.isFirst) {
      chatClient.say(
        channel,
        `¡Hola @${displayName}, bienvenido al canal! Acá vas a encontrar gaming retro/pixel art y algo de desarrollo cada tanto. Contanos: ¿Cómo llegaste al canal? y muy importante: ¿Cómo te gusta tomar el café?`,
      );
    }

    if (message.isHighlight) {
      const cleanText = `${displayName} dice: ${text.substring(0, 200)}`;
      axios.post('http://localhost:5050/api/overlay/alert', {
        message: cleanText,
        username: user,
        isTts: false, // <-- Flag clave para que el Front sepa qué hacer
        image: null, //|| 'tts-default.gif', // Imagen fija o por defecto si querés
        sound: null, // No mandamos archivo de audio
      });
    }

    if (isLurkIntent(text)) {
      const response = getLurkResponse(lowercaseUser);

      if (response) {
        chatClient.say(channel, response);
      }
    }

    if (!command.startsWith('!')) {
      chatLinesCounter++;
      return;
    }

    if (command === '!comandos') {
      chatClient.say(channel, commandManager.getCommandsListMessage());
      chatClient.say(
        channel,
        'Mirá todos los comandos disponibles en https://tehpon.martinponce.com.ar/commands',
      );
      return;
    }

    if (command === '!refrescarcomandos') {
      commandManager.loadCommands();
      chatClient.say(channel, 'Se refrescaron los comandos manualmente');
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
            `⚔️ ¡@${displayName} bienvenido al reino! Tu perfil ha sido creado. Para empezar tu viaje, elige una clase escribiendo: !clase [Guerrero / Mago / Pícaro]`,
          );
          return;
        }

        if (hero.class === 'Campesino') {
          chatClient.say(
            channel,
            `⚠️ @${displayName}, aún no elegiste tu clase. Escribe !clase [Guerrero / Mago / Picaro] para empezar.`,
          );

          return;
        }

        const weapon = ITEM_DATABASE[hero.inventory.weapon];
        const armor = ITEM_DATABASE[hero.inventory.armor];
        chatClient.say(
          channel,
          `🎒 Héroe @${displayName} [${hero.class} Nv.${hero.level}] 🌟 EXP: ${hero.exp} | 🪙 Oro: ${hero.gold} | ⚔️ Arma: ${weapon.name} | 🛡️ Armadura: ${armor.name}`,
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
            `❌ @${displayName}, no tenés un heroe creado en este reino. Usá !aventura para iniciar.`,
          );
          return;
        }

        if (hero.class === 'Campesino') {
          chatClient.say(
            channel,
            `⚠️ @${displayName}, aún no elegiste tu clase. Escribe !clase [Guerrero / Mago / Picaro] para empezar.`,
          );

          return;
        }

        const stats = (hero as any).stats;

        chatClient.say(
          channel,
          `🎒 Héroe @${displayName} [${hero.class} Nv.${hero.level}] tus stats son: 🌟 Fuerza: ${stats.fuerza} | 🌟 Vitalidad: ${stats.vitalidad} | 🌟 Destreza: ${stats.destreza} | 🌟 inteligencia: ${stats.inteligencia} | 🌟 Defensa: ${stats.defense} | 🌟 Defensa Especial: ${stats.spDefense} | 🌟 HP: ${stats.maxHp}`,
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
            `❌ @${displayName}, no tenés un heroe creado en este reino. Usá !aventura para iniciar.`,
          );
          return;
        }

        if (hero.class === 'Campesino') {
          chatClient.say(
            channel,
            `⚠️ @${displayName}, aún no elegiste tu clase. Escribe !clase [Guerrero / Mago / Picaro] para empezar.`,
          );

          return;
        }

        chatClient.say(
          channel,
          `🎒 Héroe @${displayName} [${hero.class} Nv.${hero.level}] tu 🪙 Oro total es:  ${hero.gold}`,
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
          `❌ @${displayName}, debes especificar una clase válida: !clase Guerrero, !clase Mago o !clase Pícaro.`,
        );
        return;
      }

      try {
        let hero = await Hero.findOne({ username: lowercaseUser });

        if (!hero) {
          chatClient.say(
            channel,
            `❌ @${displayName}, no tenés un heroe creado en este reino. Usá !aventura para iniciar.`,
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
            `🔄 ¡Cambio de destino! @${displayName} ha reiniciado su progreso y ahora es un *${selectedClass}* de Nivel 1. ¡Tu inventario fue restaurado! 🎒`,
          );
        } else {
          chatClient.say(
            channel,
            `✨ ¡Excelente elección @${displayName}! Te has convertido en *${selectedClass}*. Tu aventura comienza oficialmente AHORA. Escribe !aventura para ver tu estado.`,
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
          `❌ @${displayName}, debes especificar a quién desafiar. Ej: !duelo user123`,
        );
        return;
      }

      if (targetUser === lowercaseUser) {
        chatClient.say(
          channel,
          `🤣 @${displayName}, no podés batirte a duelo con vos mismo.`,
        );
        return;
      }

      try {
        const challengerHero = await Hero.findOne({ username: lowercaseUser });
        const targetHero = await Hero.findOne({ username: targetUser });

        if (!challengerHero || challengerHero.class === 'Campesino') {
          chatClient.say(
            channel,
            `❌ @${displayName}, necesitás iniciar tu aventura primero con !aventura.`,
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
          `⚔️ @${displayName} [Nv.${challengerHero.level}] ha desafiado a un duelo a @${targetUser} [Nv.${targetHero.level}]. Escribe !aceptar en los próximos 60s para pelear.`,
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
          `❌ @${displayName}, no tenés ningún desafío de duelo pendiente.`,
        );
        return;
      }

      const timePassed =
        (new Date().getTime() - pendingDuel.createdAt.getTime()) / 1000;
      if (timePassed > 60) {
        activeDuels.delete(lowercaseUser);
        chatClient.say(
          channel,
          `⏱️ El duelo pendiente para @${displayName} ha expirado.`,
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
          `🛡️ @${displayName}, la zona está tranquila. No hay monstruos acechando en este momento.`,
        );
        return;
      }

      try {
        const hero = await Hero.findOne({ username: lowercaseUser });
        if (!hero) {
          chatClient.say(
            channel,
            `❌ @${displayName}, necesitás iniciar tu aventura con !aventura para poder combatir.`,
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
          let recompensaMsg = `⚔️ @${displayName} ha derrotado a ${activeMob.emoji} *${activeMob.name}*! Ganó 🪙 ${activeMob.goldReward} de oro y 🌟 ${activeMob.expReward} de EXP.`;

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
            `💀 @${displayName} fue derrotado brutalmente por el ${activeMob.name}. El monstruo sigue libre y perdiste 🪙 ${oroPerdido} de oro por la paliza.`,
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
          `🛡️ @${displayName}, la zona está tranquila. No hay monstruos acechando en este momento.`,
        );
        return;
      }

      chatClient.say(
        channel,
        `🚨 El mob activo es un ${activeMob.emoji} *${activeMob.name}* [Nv.${activeMob.level}] (HP: ${activeMob.hp}). ¡Escribe !atacar para enfrentarlo! ⚔️`,
      );

      return;
    }

    if (command === '!promo') {
      const name = args[1]?.toLowerCase().replace('@', '');

      if (!name) {
        // Opcional: podrías responderle en el chat de Twitch que falta el texto
        chatClient.say(
          channel,
          `⚠️ @${displayName}, para usar el comando so tenés que escribir el nombre del streamer '!promo <streamer>'`,
        );
        console.log(
          `@${displayName} no envió el nombre del streamer para el SO.`,
        );
        return;
      }

      const apiUser = await userApiClient.users.getUserByName(name);
      if (apiUser == null) {
        chatClient.say(channel, `No pude encontrar al streamer '@${name}'`);
        return;
      }

      const channelInfo = await userApiClient.channels.getChannelInfoById(
        apiUser.id,
      );

      const gameName = channelInfo?.gameName;
      let message = `¡Vayan a chequear a @${apiUser.displayName} en https://twitch.tv/${name}`;
      message += gameName ? ` que estuvo stremeando: ${gameName}!` : '!';

      chatClient.say(channel, message);
      return;
    }

    if (
      command === '!so' &&
      (message.userInfo.isBroadcaster || message.userInfo.isMod)
    ) {
      const name = args[1]?.toLowerCase().replace('@', '');

      if (!name) {
        // Opcional: podrías responderle en el chat de Twitch que falta el texto
        chatClient.say(
          channel,
          `⚠️ @${displayName}, para usar el comando so tenés que escribir el nombre del streamer '!so <streamer>'`,
        );
        console.log(
          `@${displayName} no envió el nombre del streamer para el SO.`,
        );
        return;
      }

      const apiUser = await userApiClient.users.getUserByName(name);
      if (apiUser == null) {
        chatClient.say(channel, `No pude encontrar al streamer '@${name}'`);
        return;
      }

      const { displayName: soDisplayName, profilePictureUrl } = apiUser;

      const channelInfo = await userApiClient.channels.getChannelInfoById(
        apiUser.id,
      );

      const gameName = channelInfo?.gameName;
      let chatMessage = `¡Vayan a chequear a @${soDisplayName} en https://twitch.tv/${name}`;
      chatMessage += gameName ? ` que estuvo stremeando: ${gameName}!` : '!';

      chatClient.say(channel, chatMessage);

      const clips = await userApiClient.clips.getClipsForBroadcaster(
        apiUser.id,
        {
          limit: 5,
        },
      );

      const randomIndex = Math.floor(Math.random() * clips.data.length);
      const selectedClip = clips.data[randomIndex];
      console.log('Selected Clip:', selectedClip?.id);

      if (!selectedClip) return;

      if (!fs.existsSync(clipsDir)) {
        fs.mkdirSync(clipsDir, { recursive: true });
      }

      const fileName = `${selectedClip.id}.mp4`;
      const filePath = path.join(clipsDir, fileName);

      if (!fs.existsSync(filePath)) {
        console.log(`Clip no encontrado en cache. Descargando...`);

        await downloadClip(selectedClip.url, filePath);

        const stats = fs.statSync(filePath);

        if (stats.size < 100 * 1024) {
          fs.unlinkSync(filePath);

          console.error(
            `El clip descargado parece inválido: ${stats.size} bytes`,
          );

          return;
        }

        console.log(
          `Clip descargado correctamente: ${filePath} ` +
            `(${(stats.size / 1024 / 1024).toFixed(2)} MB)`,
        );
      }

      if (fs.existsSync(filePath)) {
        axios.post('http://localhost:5050/api/obs/media/play', {
          fileName,
        });
      }

      axios.post('http://localhost:5050/api/overlay/shoutout', {
        streamer: `@${displayName}`,
        avatar: profilePictureUrl,
      });

      return;
    }

    if (command === '!cebar' || command === '!matear') {
      let otherUser: string | null = args[1]?.replace('@', '');

      if (!otherUser) {
        otherUser = getRandomChatter(displayName);
      }

      if (!otherUser) {
        chatClient.say(
          channel,
          `@${displayName} está tomando mate solo porque no hay nadie más en el chat 🧉`,
        );

        return;
      }

      chatClient.say(
        channel,
        `@${displayName} le cebó un mate a @${otherUser}`,
      );

      return;
    }

    if (command === '!cafe' || command === '!cafetear') {
      let otherUser: string | null = args[1]?.replace('@', '');

      if (!otherUser) {
        otherUser = getRandomChatter(displayName);
      }

      if (!otherUser) {
        chatClient.say(
          channel,
          `@${displayName} está tomando café solo porque no hay nadie más en el chat ☕`,
        );

        return;
      }

      chatClient.say(
        channel,
        `@${displayName} le invitó un café a @${otherUser}`,
      );
      return;
    }

    const cmd = commandManager.getCommand(command);

    if (cmd) {
      // 1. Verificar Cooldown
      const secondsLeft = commandManager.checkCooldown(command);
      if (secondsLeft > 0) {
        chatClient.say(
          channel,
          `⏳ @${displayName}, el comando "${command}" está en enfriamiento. Faltan ${secondsLeft}s.`,
        );
        return;
      }

      // Formatear el mensaje si existe (remplaza {displayName} por el nombre del viewer)
      const formattedMessage = cmd.chatResponse
        ? commandManager.formatMessage(cmd.chatResponse, displayName)
        : null;

      // 2. Disparar evento a OBS/Overlay mediante WebSockets si tiene media asociado
      if (cmd.media?.soundFile || cmd.media?.imageFile) {
        axios.post('http://localhost:5050/api/overlay/alert', {
          sound: cmd.media.soundFile,
          image: cmd.media.imageFile,
          message: formattedMessage || `¡@${displayName} usó ${cmd.name}!`,
        });
      }

      // 3. Responder en el chat de Twitch
      if (formattedMessage) {
        chatClient.say(channel, formattedMessage);
      }

      // 4. Marcar timestamp para el cooldown
      commandManager.registerUsage(command);
    }
  });

  mongoose
    .connect(mongoDbUri)
    .then(() => {
      console.log('Conectado a MongoDB');
      commandManager.loadCommands();
    })
    .catch((err) => {
      console.error('Error al conectar a MongoDB:', err);
    });

  chatClient.connect();
}

main().catch(console.error);

process.on('SIGINT', () => {
  console.log('Cerrando bot...');
  cleanOldClips();
  process.exit(0);
});
