import mongoose from 'mongoose';

export const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set; skipping database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDb Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    if (process.env.VERCEL) {
      console.warn('Continuing without a database connection in serverless mode');
      return;
    }
    process.exit(1);
  }
};
