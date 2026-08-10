import { Router, Request, Response } from 'express';
import UserAttendance from '../models/UserAttendance.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { twitchId, username } = req.body;

    if (!twitchId || !username) {
      return res
        .status(400)
        .json({ error: 'twitchId y username son requeridos.' });
    }

    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    let userRecord = await UserAttendance.findOne({ twitchId });

    if (!userRecord) {
      // Primer check-in histórico
      userRecord = await UserAttendance.create({
        twitchId,
        username,
        totalCheckIns: 1,
        lastCheckIn: new Date(),
      });

      return res.status(200).json({
        totalCheckIns: userRecord.totalCheckIns,
        isNewCheckIn: true,
      });
    }

    const lastDate = new Date(userRecord.lastCheckIn)
      .toISOString()
      .split('T')[0];

    if (lastDate !== today) {
      // Nuevo día: se incrementa contador y actualiza fecha
      userRecord.totalCheckIns += 1;
      userRecord.lastCheckIn = new Date();
      userRecord.username = username; // Mantiene actualizado el username en caso de renombre
      await userRecord.save();

      return res.status(200).json({
        totalCheckIns: userRecord.totalCheckIns,
        isNewCheckIn: true,
      });
    }

    // Ya hizo check-in en el día actual
    return res.status(200).json({
      totalCheckIns: userRecord.totalCheckIns,
      isNewCheckIn: false,
    });
  } catch (error) {
    console.error('[API ATTENDANCE ERROR]:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

export default router;
