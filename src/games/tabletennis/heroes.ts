// Table Tennis Heroes

import { Hero } from './types';

export const HEROES: Hero[] = [
  // Male Heroes
  {
    id: 'wang',
    name: 'Wang Lightning',
    gender: 'male',
    avatar: '⚡',
    stats: { speed: 75, power: 70, timing: 70, spin: 75 },
    unlockCost: 0,
    unlocked: true,
    description: 'Quick reflexes and solid technique.',
  },
  {
    id: 'zhang',
    name: 'Zhang Power',
    gender: 'male',
    avatar: '💪',
    stats: { speed: 60, power: 95, timing: 55, spin: 60 },
    unlockCost: 500,
    unlocked: false,
    description: 'Devastating power loops.',
  },
  {
    id: 'liu',
    name: 'Liu Speed',
    gender: 'male',
    avatar: '🏃',
    stats: { speed: 95, power: 55, timing: 75, spin: 65 },
    unlockCost: 800,
    unlocked: false,
    description: 'Fastest footwork in the game.',
  },
  {
    id: 'chen',
    name: 'Chen Spin',
    gender: 'male',
    avatar: '🌀',
    stats: { speed: 70, power: 65, timing: 70, spin: 95 },
    unlockCost: 1000,
    unlocked: false,
    description: 'Spin master. Impossible returns.',
  },
  {
    id: 'ma',
    name: 'Ma Legend',
    gender: 'male',
    avatar: '👑',
    stats: { speed: 88, power: 85, timing: 88, spin: 90 },
    unlockCost: 2000,
    unlocked: false,
    description: 'The complete table tennis king.',
  },
  
  // Female Heroes
  {
    id: 'ding',
    name: 'Ding Grace',
    gender: 'female',
    avatar: '🌸',
    stats: { speed: 80, power: 65, timing: 75, spin: 70 },
    unlockCost: 0,
    unlocked: true,
    description: 'Elegant style with precise placement.',
  },
  {
    id: 'sun',
    name: 'Sun Fire',
    gender: 'female',
    avatar: '🔥',
    stats: { speed: 65, power: 90, timing: 60, spin: 65 },
    unlockCost: 500,
    unlocked: false,
    description: 'Aggressive attacking style.',
  },
  {
    id: 'li',
    name: 'Li Wind',
    gender: 'female',
    avatar: '💨',
    stats: { speed: 95, power: 50, timing: 85, spin: 60 },
    unlockCost: 800,
    unlocked: false,
    description: 'Lightning fast reactions.',
  },
  {
    id: 'wu',
    name: 'Wu Precision',
    gender: 'female',
    avatar: '🎯',
    stats: { speed: 75, power: 70, timing: 95, spin: 70 },
    unlockCost: 1000,
    unlocked: false,
    description: 'Perfect timing every shot.',
  },
  {
    id: 'zhou',
    name: 'Zhou Empress',
    gender: 'female',
    avatar: '👸',
    stats: { speed: 90, power: 88, timing: 88, spin: 92 },
    unlockCost: 2000,
    unlocked: false,
    description: 'World champion. Unbeatable.',
  },
];

export const getHeroById = (id: string): Hero => {
  return HEROES.find(h => h.id === id) || HEROES[0];
};

export const getHeroesByGender = (gender: 'male' | 'female'): Hero[] => {
  return HEROES.filter(h => h.gender === gender);
};

export const getUnlockedHeroes = (unlockedIds: string[]): Hero[] => {
  return HEROES.filter(h => h.unlocked || unlockedIds.includes(h.id));
};
