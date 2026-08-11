import mongoose from 'mongoose';

// Variable global en memoria para reutilizar la conexión entre invocaciones (warm starts)
let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (!process.env.MONGO_URI) {
    console.warn('⚠️ MONGO_URI not set; skipping database connection');
    return;
  }

  // Si Mongoose ya está conectado (readyState 1 = connected, 2 = connecting)
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false, // Falla rápido si la DB no está lista en vez de colgar la request
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`🔌 MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
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
