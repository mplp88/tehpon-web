import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import gamesRoutes from '../routes/games.js';
import updatesRoutes from '../routes/updates.js';
import authRoutes from '../routes/auth.js';
import twitchRoutes from '../routes/twitch.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.get('/api/health', (req, res) => {
  res.json({ message: 'API is up' });
});
app.get('/health', (req, res) => {
  res.json({ message: 'API is up' });
});

//Rutas espejadas para ver si funciona en vercel
app.use('/api/games', gamesRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/twitch', twitchRoutes);
app.use('/api/commands', twitchRoutes);

app.use('/games', gamesRoutes);
app.use('/updates', updatesRoutes);
app.use('/auth', authRoutes);
app.use('/twitch', twitchRoutes);
app.use('/commands', twitchRoutes);

app.use((err: unknown, _: Request, res: Response) => {
  console.error((err as any).stack);
  res.status(500).send('Algo salió mal en el servidor');
});

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(3000, () => {
    console.log('Servidor escuchando en http://localhost:3000');
  });
}

export default app;
