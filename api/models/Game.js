import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
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

export default mongoose.model('Game', gameSchema);
