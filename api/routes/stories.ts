import Story from '../models/Story.js';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireStreamerAdmin } from '../middlewares/auth.js';

const router = express.Router();

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadDir); // Carpeta api/uploads/
  },
  filename: (_, file, cb) => {
    // Generar nombre único: timestamp-nombreoriginal.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype.startsWith('video/')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes y videos.'));
    }
  },
});

router.get('/active', async (req, res) => {
  try {
    const activeStories = await Story.find({
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: 1 });

    res.json(activeStories);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historias' });
  }
});

router.post(
  '/',
  requireStreamerAdmin,
  upload.single('mediaFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: 'No se subió ningún archivo multimedia.' });
      }

      const { duration } = req.body;
      const mediaType = req.file.mimetype.startsWith('video/')
        ? 'video'
        : 'image';
      const mediaUrl = `/uploads/${req.file.filename}`;

      const newStory = await Story.create({
        mediaUrl,
        mediaType,
        duration: Math.max(Number(duration) || 5, 1),
      });

      res.status(201).json(newStory);
    } catch (err) {
      console.error('Error creando historia:', err);

      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: (err as Error).message || 'Error al crear la historia',
      });
    }
  },
);

export default router;
