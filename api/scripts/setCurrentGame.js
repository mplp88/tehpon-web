import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../models/Game.js';

dotenv.config();

const currentGame = `Don't Starve`;

const setCurrentGame = async () => {
  try {
    console.log('⏳ Conectando a MongoDB Atlas para la migración...');
    const mongoUri = process.env.MONGO_URI;
    console.log(`Mongo URI: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const game = await Game.findOneAndUpdate(
      { title: currentGame },
      { status: 'jugando' },
    );
    game.save();

    console.log('🏁 ¡Estado actualizado!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando el juego:', error);
    process.exit(1);
  }
};

setCurrentGame();
