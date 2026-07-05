import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import gamesRoutes from './routes/games.js';
import updatesRoutes from './routes/updates.js';
import authRoutes from './routes/auth.js';

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

app.use('/games', gamesRoutes);
app.use('/updates', updatesRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal en el servidor');
});

app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});

export default app;
