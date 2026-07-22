import { Schema, model, Document } from 'mongoose';

export interface ICommand extends Document {
  name: string; // Ej: "!rickroll", "!instagram"
  description: string; // Para mostrar en tehpon.martinponce.com.ar
  category: 'social' | 'overlay' | 'rpg' | 'utilidad';
  isActive: boolean;

  // --- CAMPOS OPCIONALES SEGÚN EL TIPO DE ACCIÓN ---
  chatResponse?: string; // Si el bot debe responder un texto fijo en el chat

  // Alertas visuales/sonoras (como el rickroll)
  media?: {
    soundFile?: string; // Ej: "rickroll.mp3"
    imageFile?: string; // Ej: "rickroll.gif"
  };

  // Configuración de Cooldown personalizada por comando
  cooldown?: number; // En segundos (ej: 30)
}

const CommandSchema = new Schema<ICommand>({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['social', 'overlay', 'rpg', 'utilidad'],
  },
  isActive: { type: Boolean, default: true },
  chatResponse: { type: String },
  media: {
    soundFile: { type: String },
    imageFile: { type: String },
  },
  cooldown: { type: Number, default: 0 },
});

export const Command = model<ICommand>('Command', CommandSchema);
