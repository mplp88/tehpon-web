import { Document, model, Schema } from 'mongoose';
import { ITEM_DATABASE } from '../config/items.js';

export const MAX_LEVEL = 30;

export type HeroClass = 'Guerrero' | 'Mago' | 'Pícaro' | 'Campesino';

export interface IHero extends Document {
  username: string;
  class: HeroClass;
  level: number;
  exp: number;
  gold: number;
  equipment: {
    weapon: string;
    armor: string;
    accessory?: string | null;
    extra?: string | null;
  };
  inventory: {
    consumables: {
      itemId: string;
      quantity: number;
    }[];
  };
  state: 'idle' | 'choosing_class' | 'in_combat';
  updatedAt: Date;

  getStats(): {
    strength: number;
    vitality: number;
    dexterity: number;
    intelligence: number;
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
    equipment: {
      weapon: { type: String, default: 'manos_desnudas' },
      armor: { type: String, default: 'ropa_vieja' },
    },
    inventory: {
      consumables: {
        type: [
          {
            itemId: { type: String, required: true },
            quantity: { type: Number, required: true, min: 0, default: 1 },
          },
        ],
      },
      default: [],
    },

    state: { type: String, enum: ['idle', 'choosing_class'], default: 'idle' },
  },
  { timestamps: true },
);

heroSchema.virtual('stats').get(function (this: IHero) {
  const lvl = this.level;
  let strength = 5,
    vitality = 5,
    dexterity = 5,
    intelligence = 5;
  let defense = 0,
    spDefense = 0,
    critMult = 1.2;

  if (this.class === 'Guerrero') {
    strength += lvl * 2;
    vitality += lvl * 3;
  } else if (this.class === 'Pícaro') {
    dexterity += lvl * 4;
    vitality += lvl * 2;
  } else if (this.class === 'Mago') {
    intelligence += lvl * 5;
    vitality += lvl * 2;
  }

  const weapon = ITEM_DATABASE[this.equipment.weapon];
  if (weapon && weapon.exclusiveClass === this.class) {
    if (weapon.statBonus?.strength) strength += weapon.statBonus.strength;
    if (weapon.statBonus?.dexterity) dexterity += weapon.statBonus.dexterity;
    if (weapon.statBonus?.intelligence)
      intelligence += weapon.statBonus.intelligence;
    if (weapon.statBonus?.vitality) vitality += weapon.statBonus.vitality;
    const critMultiplierEffect = weapon.effects?.find(
      (e) => e.type === 'crit_multiplier',
    );
    if (critMultiplierEffect?.value) {
      critMult = critMultiplierEffect.value;
    }
  }

  const armor = ITEM_DATABASE[this.equipment.armor];
  if (armor) {
    if (armor.statBonus?.defense) defense += armor.statBonus.defense;
    if (armor.statBonus?.spDefense) spDefense += armor.statBonus.spDefense;
    if (armor.statBonus?.strength) strength += armor.statBonus.strength;
    if (armor.statBonus?.dexterity) dexterity += armor.statBonus.dexterity;
    if (armor.statBonus?.intelligence)
      intelligence += armor.statBonus.intelligence;
    if (armor.statBonus?.vitality) vitality += armor.statBonus.vitality;
  }

  return {
    strength,
    vitality,
    dexterity,
    intelligence,
    defense,
    spDefense,
    critMultiplier: critMult,
    maxHp: vitality * 10,
  };
});

export const Hero = model<IHero>('Hero', heroSchema);
