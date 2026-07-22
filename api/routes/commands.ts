import { Router } from 'express';
import { Command } from '../models/Command.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const commands = await Command.find({ isActive: true }).sort({
      category: 1,
      name: 1,
    });
    res.json(commands);
  } catch (error) {
    console.log((error as Error).message);
    res.status(500).json({ error: 'Error al obtener los comandos' });
  }
});

export default router;
