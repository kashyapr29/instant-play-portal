// Badminton Smash Heroes

import { Hero } from './types';

export const HEROES: Hero[] = [
  // Male Heroes
  {
    id: 'lee',
    name: 'Lee Thunder',
    gender: 'male',
    avatar: '⚡',
    stats: { speed: 75, power: 70, timing: 70, smash: 75 },
    unlockCost: 0,
    unlocked: true,
    description: 'Balanced player with powerful smashes.',
  },
  {
    id: 'chen',
    name: 'Chen Dragon',
    gender: 'male',
    avatar: '🐉',
    stats: { speed: 65, power: 90, timing: 55, smash: 95 },
    unlockCost: 500,
    unlocked: false,
    description: 'Devastating power player.',
  },
  {
    id: 'jin',
    name: 'Jin Swift',
    gender: 'male',
    avatar: '💨',
    stats: { speed: 95, power: 55, timing: 80, smash: 60 },
    unlockCost: 800,
    unlocked: false,
    description: 'Lightning fast court coverage.',
  },
  {
    id: 'ryu',
    name: 'Ryu Master',
    gender: 'male',
    avatar: '🎯',
    stats: { speed: 70, power: 70, timing: 95, smash: 70 },
    unlockCost: 1000,
    unlocked: false,
    description: 'Perfect timing specialist.',
  },
  {
    id: 'kang',
    name: 'Kang Legend',
    gender: 'male',
    avatar: '👑',
    stats: { speed: 85, power: 85, timing: 85, smash: 88 },
    unlockCost: 2000,
    unlocked: false,
    description: 'The complete badminton master.',
  },
  
  // Female Heroes
  {
    id: 'mei',
    name: 'Mei Blossom',
    gender: 'female',
    avatar: '🌸',
    stats: { speed: 80, power: 65, timing: 75, smash: 70 },
    unlockCost: 0,
    unlocked: true,
    description: 'Graceful player with precise timing.',
  },
  {
    id: 'yuki',
    name: 'Yuki Flame',
    gender: 'female',
    avatar: '🔥',
    stats: { speed: 70, power: 88, timing: 60, smash: 90 },
    unlockCost: 500,
    unlocked: false,
    description: 'Aggressive power hitter.',
  },
  {
    id: 'ling',
    name: 'Ling Wind',
    gender: 'female',
    avatar: '🌪️',
    stats: { speed: 95, power: 50, timing: 85, smash: 55 },
    unlockCost: 800,
    unlocked: false,
    description: 'Fastest feet on the court.',
  },
  {
    id: 'hana',
    name: 'Hana Ace',
    gender: 'female',
    avatar: '⭐',
    stats: { speed: 75, power: 75, timing: 90, smash: 65 },
    unlockCost: 1000,
    unlocked: false,
    description: 'Precision placement expert.',
  },
  {
    id: 'kim',
    name: 'Kim Empress',
    gender: 'female',
    avatar: '👸',
    stats: { speed: 88, power: 88, timing: 88, smash: 90 },
    unlockCost: 2000,
    unlocked: false,
    description: 'Olympic champion. Dominates all courts.',
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
