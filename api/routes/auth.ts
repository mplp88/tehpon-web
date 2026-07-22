import express from 'express';
import axios from 'axios';

const router = express.Router();

// Endpoint para validar el token actual y retornar el perfil
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ isAdmin: false, user: null });
  }

  const twitchToken = authHeader.split(' ')[1];

  try {
    // Le preguntamos a Twitch quién es
    const twitchResponse = await axios.get(
      'https://api.twitch.tv/helix/users',
      {
        headers: {
          Authorization: `Bearer ${twitchToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID,
        },
      },
    );

    const twitchUser = twitchResponse.data.data[0];
    if (!twitchUser) {
      return res.status(401).json({ isAdmin: false, user: null });
    }

    // Verificamos si es tu ID configurado en el .env
    const isAdmin = twitchUser.id === process.env.TWITCH_STREAMER_ID;

    return res.json({
      isAdmin,
      user: {
        id: twitchUser.id,
        display_name: twitchUser.display_name,
        profile_image_url: twitchUser.profile_image_url,
      },
    });
  } catch (error) {
    console.error((error as Error).message);
    res.status(401).json({ isAdmin: false, user: null });
  }
});

export default router;
