import { Schema, model, Document } from 'mongoose';

export interface IDeathCounter extends Document {
  gameTitle: string;
  totalDeaths: number;
  currentSession: {
    deaths: number;
    sessionId: string;
    startedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DeathCounterSchema = new Schema<IDeathCounter>(
  {
    gameTitle: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalDeaths: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currentSession: {
      deaths: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      sessionId: {
        type: String,
        required: true,
      },
      startedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  },
);

export default model<IDeathCounter>('DeathCounter', DeathCounterSchema);
