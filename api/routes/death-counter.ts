import { Router, Request, Response } from 'express';
import DeathCounter from '../models/DeathCounter.js';
import Game from '../models/Game.js';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/', async (_, res: Response) => {
  try {
    const game = await Game.findOne({ status: 'jugando' });

    if (!game) {
      return res.status(404).json({
        message: 'No current game configured',
      });
    }

    const { title: gameTitle } = game;
    let counter = await DeathCounter.findOne({ gameTitle });

    if (!counter) {
      counter = await DeathCounter.create({
        gameTitle,
        totalDeaths: 0,
        currentSession: {
          deaths: 0,
          sessionId: randomUUID(),
          startedAt: new Date(),
        },
      });
    }

    return res.json({
      gameTitle: counter.gameTitle,
      totalDeaths: counter.totalDeaths,
      sessionDeaths: counter.currentSession.deaths,
    });
  } catch (error) {
    console.error('[DEATH COUNTER GET ERROR]:', error);

    return res.status(500).json({
      message: 'Error getting death counter',
    });
  }
});

router.post('/add', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        message: 'Amount must be a positive integer',
      });
    }

    const game = await Game.findOne({ status: 'jugando' });

    if (!game) {
      return res.status(404).json({
        message: 'No current game configured',
      });
    }

    const { title: gameTitle } = game;
    const counter = await DeathCounter.findOneAndUpdate(
      { gameTitle },
      {
        $inc: {
          totalDeaths: amount,
          'currentSession.deaths': amount,
        },
      },
      {
        returnDocument: 'after',
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.json({
      gameTitle: counter!.gameTitle,
      totalDeaths: counter!.totalDeaths,
      sessionDeaths: counter!.currentSession.deaths,
    });
  } catch (error) {
    console.error('[DEATH COUNTER ADD ERROR]:', error);

    return res.status(500).json({
      message: 'Error adding deaths',
    });
  }
});

router.post('/reset', async (_, res: Response) => {
  try {
    const game = await Game.findOne({ status: 'jugando' });

    if (!game) {
      return res.status(404).json({
        message: 'No current game configured',
      });
    }

    const { title: gameTitle } = game;
    const counter = await DeathCounter.findOneAndUpdate(
      { gameTitle },
      {
        $set: {
          'currentSession.deaths': 0,
          'currentSession.sessionId': randomUUID(),
          'currentSession.startedAt': new Date(),
        },
      },
      {
        returnDocument: 'after',
      },
    );

    if (!counter) {
      return res.status(404).json({
        message: 'Death counter not found',
      });
    }

    return res.json({
      gameTitle: counter.gameTitle,
      totalDeaths: counter.totalDeaths,
      sessionDeaths: counter.currentSession.deaths,
    });
  } catch (error) {
    console.error('[DEATH COUNTER RESET ERROR]:', error);

    return res.status(500).json({
      message: 'Error resetting death counter',
    });
  }
});

export default router;
