// Tennis Hero Characters

import { Hero } from './types';

export const HEROES: Hero[] = [
  // Male Heroes
  {
    id: 'alex',
    name: 'Alex Storm',
    gender: 'male',
    avatar: '⚡',
    stats: { speed: 70, power: 80, timing: 65, spin: 60 },
    unlockCost: 0,
    unlocked: true,
    description: 'Balanced all-rounder with powerful serves.',
  },
  {
    id: 'max',
    name: 'Max Thunder',
    gender: 'male',
    avatar: '💪',
    stats: { speed: 60, power: 95, timing: 55, spin: 50 },
    unlockCost: 500,
    unlocked: false,
    description: 'Power hitter. Devastating groundstrokes.',
  },
  {
    id: 'leo',
    name: 'Leo Swift',
    gender: 'male',
    avatar: '🏃',
    stats: { speed: 95, power: 55, timing: 75, spin: 65 },
    unlockCost: 800,
    unlocked: false,
    description: 'Speed demon. Reaches every ball.',
  },
  {
    id: 'carlos',
    name: 'Carlos Spin',
    gender: 'male',
    avatar: '🌀',
    stats: { speed: 70, power: 65, timing: 70, spin: 95 },
    unlockCost: 1000,
    unlocked: false,
    description: 'Spin master. Unpredictable ball movement.',
  },
  {
    id: 'ken',
    name: 'Ken Legend',
    gender: 'male',
    avatar: '👑',
    stats: { speed: 85, power: 85, timing: 85, spin: 85 },
    unlockCost: 2000,
    unlocked: false,
    description: 'The complete package. True champion.',
  },
  
  // Female Heroes
  {
    id: 'emma',
    name: 'Emma Grace',
    gender: 'female',
    avatar: '🌸',
    stats: { speed: 75, power: 70, timing: 75, spin: 65 },
    unlockCost: 0,
    unlocked: true,
    description: 'Elegant player with precise timing.',
  },
  {
    id: 'sofia',
    name: 'Sofia Blaze',
    gender: 'female',
    avatar: '🔥',
    stats: { speed: 65, power: 90, timing: 60, spin: 55 },
    unlockCost: 500,
    unlocked: false,
    description: 'Aggressive baseline player.',
  },
  {
    id: 'maya',
    name: 'Maya Wind',
    gender: 'female',
    avatar: '💨',
    stats: { speed: 95, power: 50, timing: 80, spin: 70 },
    unlockCost: 800,
    unlocked: false,
    description: 'Lightning fast reflexes.',
  },
  {
    id: 'nina',
    name: 'Nina Ace',
    gender: 'female',
    avatar: '🎯',
    stats: { speed: 75, power: 75, timing: 95, spin: 60 },
    unlockCost: 1000,
    unlocked: false,
    description: 'Perfect timing specialist.',
  },
  {
    id: 'victoria',
    name: 'Victoria Queen',
    gender: 'female',
    avatar: '👸',
    stats: { speed: 88, power: 88, timing: 88, spin: 88 },
    unlockCost: 2000,
    unlocked: false,
    description: 'Legendary champion. Dominates all courts.',
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
