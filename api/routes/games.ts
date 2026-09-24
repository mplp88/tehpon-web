import express from 'express';
import axios from 'axios';
import Game from '../models/Game.js';
import { requireStreamerAdmin } from '../middlewares/auth.js';

const router = express.Router();

/**
 * Obtener todos los juegos
 */
router.get('/', async (_req, res) => {
  try {
    const games = await Game.find().sort({ votedBy: -1 });

    res.json(games);
  } catch (error) {
    console.error('Error al obtener los juegos:', error);

    res.status(500).json({
      message: 'Error al obtener los juegos',
    });
  }
});

/**
 * Obtener el juego actual
 */
router.get('/current-game', async (_req, res) => {
  try {
    const game = await Game.findOne({ status: 'jugando' });

    if (!game) {
      return res.status(404).json({
        message: 'No hay un juego actualmente en curso',
      });
    }

    res.json(game);
  } catch (error) {
    console.error('Error al obtener el juego actual:', error);

    res.status(500).json({
      message: 'Error al obtener el juego actual',
    });
  }
});

/**
 * Agregar un juego
 */
router.post('/', requireStreamerAdmin, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({
        message: 'El título del juego es obligatorio',
      });
    }

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      return res.status(400).json({
        message: 'El título del juego no puede estar vacío',
      });
    }

    const existingGame = await Game.findOne({
      title: normalizedTitle,
    });

    if (existingGame) {
      return res.status(409).json({
        message: 'El juego ya existe en la lista',
        game: existingGame,
      });
    }

    const game = await Game.create({
      title: normalizedTitle,
      status: 'pendiente',
      votedBy: [],
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('Error al agregar el juego:', error);

    res.status(500).json({
      message: 'Error al agregar el juego',
    });
  }
});

/**
 * Establecer juego actual
 */
router.patch('/:id/current', requireStreamerAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({
        message: 'Juego no encontrado',
      });
    }

    // Sacamos el estado "jugando" de cualquier otro juego.
    await Game.updateMany(
      { status: 'jugando', _id: { $ne: game._id } },
      { $set: { status: 'pendiente' } },
    );

    game.status = 'jugando';
    await game.save();

    res.json({
      success: true,
      message: `Ahora estás jugando ${game.title}`,
      game,
    });
  } catch (error) {
    console.error('Error al cambiar el juego actual:', error);

    res.status(500).json({
      message: 'Error al cambiar el juego actual',
    });
  }
});

/**
 * Votar / quitar voto
 */
router.post('/:id/vote', async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No autorizado. Token de Twitch faltante.',
    });
  }

  const twitchToken = authHeader.split(' ')[1];

  try {
    const twitchResponse = await axios.get(
      'https://api.twitch.tv/helix/users',
      {
        headers: {
          Authorization: `Bearer ${twitchToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID,
        },
      },
    );

    const twitchUserId = twitchResponse.data.data[0]?.id;

    if (!twitchUserId) {
      return res.status(401).json({
        message: 'Token de Twitch inválido o expirado.',
      });
    }

    const game = await Game.findById(id);

    if (!game) {
      return res.status(404).json({
        message: 'Juego no encontrado.',
      });
    }

    if (game.status !== 'pendiente') {
      return res.status(400).json({
        message: 'Solo se puede votar por juegos pendientes.',
      });
    }

    const hasVoted = game.votedBy.includes(twitchUserId);

    if (hasVoted) {
      game.votedBy = game.votedBy.filter((userId) => userId !== twitchUserId);

      await game.save();

      return res.json({
        success: true,
        action: 'unvote',
        message: 'Voto removido correctamente',
        game,
      });
    }

    game.votedBy.push(twitchUserId);
    await game.save();

    res.json({
      success: true,
      action: 'vote',
      message: '¡Voto registrado!',
      game,
    });
  } catch (error) {
    console.error('Error al procesar el voto:', error);

    res.status(500).json({
      success: false,
      message: 'Error interno al procesar el voto.',
    });
  }
});

export default router;
