import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

export const requireStreamerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    console.error('[Auth Middleware Error]:', (error as Error).message);
    return res
      .status(401)
      .json({ message: 'Token de Twitch inválido o vencido.' });
  }
};
