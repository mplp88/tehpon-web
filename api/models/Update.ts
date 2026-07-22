import { Schema, model, Document } from 'mongoose';

export interface IUpdate extends Document {
  title: string;
  description: string;
}

const updateSchema = new Schema<IUpdate>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export default model<IUpdate>('Update', updateSchema);
