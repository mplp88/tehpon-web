import { HeroClass } from '../models/Hero.js';

export interface IGameItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  exclusiveClass: HeroClass;
  statBonus: {
    fuerza?: number;
    destreza?: number;
    inteligencia?: number;
    defense?: number;
    vitalidad?: number;
    spDefense?: number;
    critMultiplier?: number;
  };
}

export const ITEM_DATABASE: Record<string, IGameItem> = {
  // Nuevos items básicos
  manos_desnudas: {
    id: 'manos_desnudas',
    name: '👊 Manos Desnudas',
    type: 'weapon',
    exclusiveClass: 'Campesino',
    statBonus: { fuerza: 5, destreza: 5, inteligencia: 5 },
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
    statBonus: { fuerza: 12 },
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
    statBonus: { destreza: 14, critMultiplier: 1.2 },
  },
  capa_sombras: {
    id: 'capa_sombras',
    name: '🧥 Capa de Sombras',
    type: 'armor',
    exclusiveClass: 'Pícaro',
    statBonus: { defense: 4, destreza: 4 },
  },

  baculo_gastado: {
    id: 'baculo_gastado',
    name: '🪄 Báculo Gastado',
    type: 'weapon',
    exclusiveClass: 'Mago',
    statBonus: { inteligencia: 15 },
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
    statBonus: { fuerza: 30 },
  },
  hacha_batalla: {
    id: 'hacha_batalla',
    name: '🪓 Hacha de Batalla Pesada',
    type: 'weapon',
    exclusiveClass: 'Guerrero',
    statBonus: { fuerza: 45 },
  },
  armadura_placas: {
    id: 'armadura_placas',
    name: '🛡️ Armadura de Placas',
    type: 'armor',
    exclusiveClass: 'Guerrero',
    statBonus: { defense: 30, spDefense: 5 },
  },

  dagas_venenosas: {
    id: 'dagas_venenosas',
    name: '🎚️ Dagas Venenosas',
    type: 'weapon',
    exclusiveClass: 'Pícaro',
    statBonus: { destreza: 28, critMultiplier: 1.3 },
  },
  garras_sombra: {
    id: 'garras_sombra',
    name: '🐾 Garras de las Sombras',
    type: 'weapon',
    exclusiveClass: 'Pícaro',
    statBonus: { destreza: 22, critMultiplier: 1.5 },
  },
  jubon_tachonado: {
    id: 'jubon_tachonado',
    name: '🧥 Jubón Tachonado',
    type: 'armor',
    exclusiveClass: 'Pícaro',
    statBonus: { defense: 14, destreza: 5 },
  },

  baculo_cristal: {
    id: 'baculo_cristal',
    name: '🔮 Báculo de Cristal',
    type: 'weapon',
    exclusiveClass: 'Mago',
    statBonus: { inteligencia: 32 },
  },
  libro_hechizos: {
    id: 'libro_hechizos',
    name: '📖 Grimorio Ancestral',
    type: 'weapon',
    exclusiveClass: 'Mago',
    statBonus: { inteligencia: 50 },
  },
  tunica_archimago: {
    id: 'tunica_archimago',
    name: '🔮 Túnica de Archimago',
    type: 'armor',
    exclusiveClass: 'Mago',
    statBonus: { spDefense: 25, inteligencia: 4 },
  },
};
