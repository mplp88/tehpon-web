import { Document, model, Schema } from 'mongoose';
import { ITEM_DATABASE } from '../config/items.js';

export const MAX_LEVEL = 30;

export type HeroClass = 'Guerrero' | 'Mago' | 'Pícaro' | 'Campesino';

export interface IWeapon {
  name: string;
  atk: number;
  critMultiplier?: number; // Para el crítico del pícaro
  exclusiveClass: 'Guerrero' | 'Mago' | 'Pícaro';
}

export interface IArmor {
  name: string;
  defense: number;
  spDefense: number;
}

export interface IHero extends Document {
  username: string;
  class: HeroClass;
  level: number;
  exp: number;
  gold: number;
  inventory: {
    weapon: string;
    armor: string;
  };
  state: 'idle' | 'choosing_class' | 'in_combat';
  updatedAt: Date;

  getStats(): {
    fuerza: number;
    vitalidad: number;
    destreza: number;
    inteligencia: number;
    maxHp: number;
  };
}

const heroSchema = new Schema<IHero>(
  {
    username: { type: String, required: true, unique: true, lowercase: true },
    class: {
      type: String,
      enum: ['Guerrero', 'Mago', 'Pícaro', 'Campesino'],
      default: 'Campesino',
    },
    level: { type: Number, default: 1, max: MAX_LEVEL },
    exp: { type: Number, default: 0 },
    gold: { type: Number, default: 10 },
    inventory: {
      weapon: { type: String, default: 'manos_desnudas' },
      armor: { type: String, default: 'ropa_vieja' },
    },
    state: { type: String, enum: ['idle', 'choosing_class'], default: 'idle' },
  },
  { timestamps: true },
);

heroSchema.virtual('stats').get(function (this: IHero) {
  const lvl = this.level;
  let fuerza = 5,
    vitalidad = 5,
    destreza = 5,
    inteligencia = 5;
  let defense = 0,
    spDefense = 0,
    critMult = 1.2;

  if (this.class === 'Guerrero') {
    fuerza += lvl * 3;
    vitalidad += lvl * 4;
  } else if (this.class === 'Pícaro') {
    destreza += lvl * 4;
    vitalidad += lvl * 2;
  } else if (this.class === 'Mago') {
    inteligencia += lvl * 5;
    vitalidad += lvl * 2;
  }

  const weapon = ITEM_DATABASE[this.inventory.weapon];
  if (weapon && weapon.exclusiveClass === this.class) {
    if (weapon.statBonus.fuerza) fuerza += weapon.statBonus.fuerza;
    if (weapon.statBonus.destreza) destreza += weapon.statBonus.destreza;
    if (weapon.statBonus.inteligencia)
      inteligencia += weapon.statBonus.inteligencia;
    if (weapon.statBonus.vitalidad) vitalidad += weapon.statBonus.vitalidad;
    if (weapon.statBonus.critMultiplier)
      critMult = weapon.statBonus.critMultiplier;
  }

  const armor = ITEM_DATABASE[this.inventory.armor];
  if (armor) {
    if (armor.statBonus.defense) defense += armor.statBonus.defense;
    if (armor.statBonus.spDefense) spDefense += armor.statBonus.spDefense;
    if (armor.statBonus.fuerza) fuerza += armor.statBonus.fuerza;
    if (armor.statBonus.destreza) destreza += armor.statBonus.destreza;
    if (armor.statBonus.inteligencia)
      inteligencia += armor.statBonus.inteligencia;
    if (armor.statBonus.vitalidad) vitalidad += armor.statBonus.vitalidad;
  }

  return {
    fuerza,
    vitalidad,
    destreza,
    inteligencia,
    defense,
    spDefense,
    critMultiplier: critMult,
    maxHp: vitalidad * 10,
  };
});

export const Hero = model<IHero>('Hero', heroSchema);
