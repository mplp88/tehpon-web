import { HeroClass } from '../models/Hero.js';

type ItemEffectType =
  | 'crit_chance'
  | 'crit_multiplier'
  | 'damage_percent'
  | 'max_hp_percent'
  | 'dodge_chance'
  | 'elemental_damage';

export interface IItemEffect {
  type: ItemEffectType;
  value?: number;
}

export interface IGameItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable';
  exclusiveClass?: HeroClass;
  statBonus?: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    defense?: number;
    vitality?: number;
    spDefense?: number;
  };
  effects?: IItemEffect[];
  shop?: {
    price: number;
  };
}

export const ITEM_DATABASE: Record<string, IGameItem> = {
  // Nuevos items básicos
  manos_desnudas: {
    id: 'manos_desnudas',
    name: '👊 Manos Desnudas',
    type: 'weapon',
    exclusiveClass: 'Campesino',
    statBonus: { strength: 5, dexterity: 5, intelligence: 5 },
  },
  ropa_vieja: {
    id: 'ropa_vieja',
    name: '👕 Ropa Vieja',
    type: 'armor',
    exclusiveClass: 'Campesino',
    statBonus: { defense: 2, spDefense: 2 },
  },

  espada_madera: {
    id: 'espada_madera',
    name: '🪵 Espada de Madera',
    type: 'weapon',
    exclusiveClass: 'Guerrero',
    statBonus: { strength: 8 },
  },
  escudo_cuero: {
    id: 'escudo_cuero',
    name: '🛡️ Escudo de Cuero',
    type: 'armor',
    exclusiveClass: 'Guerrero',
    statBonus: { defense: 10, spDefense: 2 },
  },

  dagas_hierro: {
    id: 'dagas_hierro',
    name: '🎚️ Dagas de Hierro',
    type: 'weapon',
    exclusiveClass: 'Pícaro',
    statBonus: { dexterity: 14 },
    effects: [
      {
        type: 'crit_multiplier',
        value: 1.1,
      },
    ],
  },
  capa_sombras: {
    id: 'capa_sombras',
    name: '🧥 Capa de Sombras',
    type: 'armor',
    exclusiveClass: 'Pícaro',
    statBonus: { defense: 6, dexterity: 4 },
  },

  baculo_gastado: {
    id: 'baculo_gastado',
    name: '🪄 Báculo Gastado',
    type: 'weapon',
    exclusiveClass: 'Mago',
    statBonus: { intelligence: 15 },
  },
  tunica_aprendiz: {
    id: 'tunica_aprendiz',
    name: '🧥 Túnica de Aprendiz',
    type: 'armor',
    exclusiveClass: 'Mago',
    statBonus: { spDefense: 8 },
  },

  espada_hierro: {
    id: 'espada_hierro',
    name: '🗡️ Espada de Hierro',
    type: 'weapon',
    exclusiveClass: 'Guerrero',
    statBonus: { strength: 25 },
    shop: {
      price: 100,
    },
  },
  hacha_batalla: {
    id: 'hacha_batalla',
    name: '🪓 Hacha de Batalla Pesada',
    type: 'weapon',
    exclusiveClass: 'Guerrero',
    statBonus: { strength: 32 },
    shop: {
      price: 150,
    },
  },
  armadura_placas: {
    id: 'armadura_placas',
    name: '🛡️ Armadura de Placas',
    type: 'armor',
    exclusiveClass: 'Guerrero',
    statBonus: { defense: 30, spDefense: 5 },
    shop: {
      price: 200,
    },
  },

  dagas_venenosas: {
    id: 'dagas_venenosas',
    name: '🎚️ Dagas Venenosas',
    type: 'weapon',
    exclusiveClass: 'Pícaro',
    statBonus: { dexterity: 28 },
    effects: [
      {
        type: 'crit_multiplier',
        value: 1.3,
      },
    ],
    shop: {
      price: 100,
    },
  },
  garras_sombra: {
    id: 'garras_sombra',
    name: '🐾 Garras de las Sombras',
    type: 'weapon',
    exclusiveClass: 'Pícaro',
    statBonus: { dexterity: 35 },
    effects: [
      {
        type: 'crit_multiplier',
        value: 1.5,
      },
    ],
    shop: {
      price: 150,
    },
  },
  jubon_tachonado: {
    id: 'jubon_tachonado',
    name: '🧥 Jubón Tachonado',
    type: 'armor',
    exclusiveClass: 'Pícaro',
    statBonus: { defense: 16, dexterity: 5 },
    shop: {
      price: 200,
    },
  },

  baculo_cristal: {
    id: 'baculo_cristal',
    name: '🔮 Báculo de Cristal',
    type: 'weapon',
    exclusiveClass: 'Mago',
    statBonus: { intelligence: 32 },
    shop: {
      price: 100,
    },
  },
  libro_hechizos: {
    id: 'libro_hechizos',
    name: '📖 Libro de Hechizos',
    type: 'weapon',
    exclusiveClass: 'Mago',
    statBonus: { intelligence: 50 },
    shop: {
      price: 150,
    },
  },
  tunica_archimago: {
    id: 'tunica_archimago',
    name: '🔮 Túnica de Archimago',
    type: 'armor',
    exclusiveClass: 'Mago',
    statBonus: { spDefense: 20, intelligence: 4 },
    shop: {
      price: 200,
    },
  },

  ring_of_fury: {
    id: 'ring_of_fury',
    name: 'Ring of Fury',
    type: 'accessory',
    effects: [
      {
        type: 'damage_percent',
        value: 30,
      },
      {
        type: 'max_hp_percent',
        value: -10,
      },
    ],
  },

  lucky_ring: {
    id: 'lucky_ring',
    name: 'Lucky Ring',
    type: 'accessory',
    effects: [
      {
        type: 'crit_chance',
        value: 10,
      },
    ],
  },

  shadow_amulet: {
    id: 'shadow_amulet',
    name: 'Shadow Amulet',
    type: 'accessory',
    effects: [
      {
        type: 'dodge_chance',
        value: 15,
      },
    ],
  },

  berserkers_mark: {
    id: 'berserkers_mark',
    name: "Berserker's Mark",
    type: 'accessory',
    effects: [
      {
        type: 'damage_percent',
        value: 50, //TODO: Below 30% HP 50 -> 75
      },
    ],
  },

  // vampiric_fang: {
  //   id: 'vampiric_fang',
  //   name: 'Vampiric Fang',
  //   type: 'accessory',
  //   effects: [
  //     {
  //       type: '', //TODO: add heal_after_attack
  //       value: 50,
  //     },
  //   ],
  // },

  // Infernal Core
  // +20% Fire Damage
};
