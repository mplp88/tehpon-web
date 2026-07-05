import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Game from '../models/Game.js';

dotenv.config();

const notepadGames = [
  'Blasphemous',
  'Coromon',
  'Cuphead',
  "Don't Starve",
  'Enter the Gungeon',
  'Ex Vitro',
  '.Forty-Five',
  'Gravity Circuit',
  'GRIS',
  'Jet Set Radio',
  'Limbo',
  'Nocturnal (Comprobar performance)',
  'One Gun Guy',
  'Risk of Rain ',
  'Rogue Worlds',
  'Secrets of Raetikon',
  'Super Meat Boy',
  'Terraria',
  'The Stone of Madness',
  'The WereCleaner',
  'Undertale',
  'UnMetal',
  'Wizard of Legend',
];

const seedGames = async () => {
  try {
    console.log('⏳ Conectando a MongoDB Atlas para la migración...');
    const mongoUri = process.env.MONGO_URI;
    console.log(`Mongo URI: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    const gamesToInsert = notepadGames.map((title) => ({
      title: title,
      status: 'pendiente',
      votedBy: [],
    }));

    for (const game of gamesToInsert) {
      const exists = await Game.findOne({ title: game.title });
      if (!exists) {
        await Game.create(game);
        console.log(`✅ Insertado: ${game.title}`);
      } else {
        console.log(`⚠️ Ya existe (saltado): ${game.title}`);
      }
    }

    console.log('🏁 ¡Migración masiva finalizada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error inyectando los juegos:', error);
    process.exit(1);
  }
};

seedGames();
