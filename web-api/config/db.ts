import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  if (!process.env.MONGO_URI) {
    console.warn('⚠️ MONGO_URI not set; skipping database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🔌 MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    // 💡 Tipamos el error como 'any' o usamos una aserción para poder leer el .message sin que TS proteste
    const err = error as Error;
    console.error(`❌ Error en la conexión a MongoDB: ${err.message}`);

    if (process.env.VERCEL) {
      console.warn(
        'Continuing without a database connection in serverless mode',
      );
      return;
    }
    process.exit(1);
  }
};
