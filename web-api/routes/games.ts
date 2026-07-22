import express from 'express';
import axios from 'axios';
import Game from '../models/Game.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const games = await Game.find().sort({ votedBy: -1 });
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los juegos' });
  }
});

router.get('/current-game', async (req, res) => {
  try {
    const game = await Game.findOne({ status: 'jugando' });
    res.json(game);
  } catch (err) {
    console.log('Ocurrió un error al obtener el juego actual');
  }
});

router.post('/:id/vote', async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'No autorizado. Token de Twitch faltante.' });
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
      return res
        .status(401)
        .json({ message: 'Token de Twitch inválido o expirado.' });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ message: 'Juego no encontrado.' });
    }

    if (game.status !== 'pendiente') {
      return res
        .status(400)
        .json({ message: 'Solo se puedo votar por juegos pendientes' });
    }

    const hasVoted = game.votedBy.includes(twitchUserId);
    if (hasVoted) {
      game.votedBy = game.votedBy.filter((id) => id !== twitchUserId);
      await game.save();
      return res.json({
        success: true,
        action: 'unvote',
        message: 'Voto removido correctamente',
        game,
      });
    } else {
      game.votedBy.push(twitchUserId);
      await game.save();
      return res.json({
        success: true,
        action: 'vote',
        message: '¡Voto registrado!',
        game,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: 'Error interno al procesar el voto.' });
  }
});

export default router;
