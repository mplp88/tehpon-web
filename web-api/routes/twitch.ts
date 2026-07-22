import express from 'express';
import axios, { AxiosError, AxiosResponse } from 'axios';

const router = express.Router();

// Guardamos el token en memoria para no pedirlo a Twitch en cada click
let appAccessToken: string | null = null;

const getAppToken = async () => {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
  const res = await axios.post(url);
  appAccessToken = res.data?.access_token as string;
};

router.get('/status', async (req, res) => {
  try {
    if (!appAccessToken) await getAppToken();

    const streamerUsername = 'tehpon';

    const url = `https://api.twitch.tv/helix/streams?user_login=${streamerUsername}`;

    let twitchRes;
    try {
      twitchRes = await axios.get(url, {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${appAccessToken}`,
        },
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await getAppToken();
        twitchRes = await axios.get(url, {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${appAccessToken}`,
          },
        });
      } else {
        throw err;
      }
    }

    const isLive = twitchRes.data.data.length > 0;

    return res.json({
      isLive,
      streamData: isLive ? twitchRes.data.data[0] : null,
    });
  } catch (error) {
    console.error((error as Error).message);
    return res
      .status(500)
      .json({ isLive: false, error: 'Error al consultar Twitch' });
  }
});

export default router;
