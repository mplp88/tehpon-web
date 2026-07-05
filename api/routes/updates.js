import express from 'express';
import axios from 'axios';
import Update from '../models/Update.js';

const router = express.Router();

const requireStreamerAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado. Token ausente.' });
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

    if (!twitchUserId || twitchUserId !== process.env.TWITCH_STREAMER_ID) {
      return res.status(403).json({
        message: 'Acceso denegado. No tenés permisos de administrador.',
      });
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: 'Token de Twitch inválido o vencido.' });
  }
};

router.get('/', async (req, res) => {
  try {
    const updates = await Update.find().sort({ createdAt: -1 }); // Las más nuevas arriba
    res.json(updates);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener novedades.' });
  }
});

router.post('/', requireStreamerAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const newUpdate = await Update.create({ title, description });
    res.status(201).json(newUpdate);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear la novedad.' });
  }
});

router.put('/:id', requireStreamerAdmin, async (req, res) => {
  try {
    const updated = await Update.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar.' });
  }
});

router.delete('/:id', requireStreamerAdmin, async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Novedad eliminada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar.' });
  }
});

export default router;
