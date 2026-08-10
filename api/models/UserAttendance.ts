import { Schema, model, Document } from 'mongoose';

export interface IUserAttendance extends Document {
  twitchId: string;
  username: string;
  totalCheckIns: number;
  lastCheckIn: Date;
}

const userAttendanceSchema = new Schema<IUserAttendance>({
  twitchId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  totalCheckIns: { type: Number, required: true, default: 0 },
  lastCheckIn: { type: Date, required: true, default: Date.now },
});

export default model<IUserAttendance>('UserAttendance', userAttendanceSchema);
