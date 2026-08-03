import { Document, model, Schema } from 'mongoose';

interface IStory extends Document {
  mediaUrl: string;
  mediaType: string;
  duration: number;
  createdAt: Date;
  expiresAt: Date;
}

const storySchema = new Schema<IStory>({
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  duration: {
    type: Number,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira automáticamente a las 24hs
  },
});

// Índice TTL para que MongoDB borre físicamente el documento expirado si querés
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model<IStory>('Story', storySchema);
