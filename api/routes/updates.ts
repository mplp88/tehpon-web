import express from 'express';
import Update from '../models/Update.js';
import { requireStreamerAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const updates = await Update.find().sort({ createdAt: -1 }); // Las más nuevas arriba
    res.json(updates);
  } catch (error) {
    console.log((error as Error).message);
    return res.status(500).json({ message: 'Error al obtener novedades.' });
  }
});

router.post('/', requireStreamerAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const newUpdate = await Update.create({ title, description });
    res.status(201).json(newUpdate);
  } catch (error) {
    console.log((error as Error).message);
    return res.status(400).json({ message: 'Error al crear la novedad.' });
  }
});

router.put('/:id', requireStreamerAdmin, async (req, res) => {
  try {
    const updated = await Update.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (error) {
    console.log((error as Error).message);
    return res.status(400).json({ message: 'Error al actualizar.' });
  }
});

router.delete('/:id', requireStreamerAdmin, async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Novedad eliminada.' });
  } catch (error) {
    console.log((error as Error).message);
    return res.status(500).json({ message: 'Error al eliminar.' });
  }
});

export default router;
