import { Schema, model, Document } from 'mongoose';

export interface IGame extends Document {
  title: string;
  status: string;
  votedBy: string[];
}

const gameSchema = new Schema<IGame>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pendiente', 'jugando', 'completado'],
      default: 'pendiente',
    },
    votedBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

gameSchema.virtual('voteCount').get(function () {
  return this.votedBy.length;
});

gameSchema.set('toJSON', { virtuals: true });

export default model<IGame>('Game', gameSchema);
