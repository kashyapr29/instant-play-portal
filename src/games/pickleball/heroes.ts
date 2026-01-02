import { Hero } from './types';
export const HEROES: Hero[] = [
  { id: 'ben', name: 'Ben Ace', gender: 'male', avatar: '🎾', stats: { speed: 75, power: 70, timing: 70, dink: 75 }, unlockCost: 0, unlocked: true, description: 'Balanced all-rounder.' },
  { id: 'tyson', name: 'Tyson Power', gender: 'male', avatar: '💪', stats: { speed: 60, power: 95, timing: 55, dink: 50 }, unlockCost: 500, unlocked: false, description: 'Power drive specialist.' },
  { id: 'jay', name: 'Jay Swift', gender: 'male', avatar: '⚡', stats: { speed: 95, power: 55, timing: 80, dink: 65 }, unlockCost: 800, unlocked: false, description: 'Lightning fast reflexes.' },
  { id: 'kyle', name: 'Kyle Dink', gender: 'male', avatar: '🎯', stats: { speed: 70, power: 60, timing: 75, dink: 95 }, unlockCost: 1000, unlocked: false, description: 'Kitchen dink master.' },
  { id: 'zane', name: 'Zane Legend', gender: 'male', avatar: '👑', stats: { speed: 88, power: 85, timing: 88, dink: 88 }, unlockCost: 2000, unlocked: false, description: 'Complete champion.' },
  { id: 'anna', name: 'Anna Grace', gender: 'female', avatar: '🌟', stats: { speed: 80, power: 65, timing: 75, dink: 80 }, unlockCost: 0, unlocked: true, description: 'Precise and strategic.' },
  { id: 'lea', name: 'Lea Fire', gender: 'female', avatar: '🔥', stats: { speed: 65, power: 90, timing: 60, dink: 55 }, unlockCost: 500, unlocked: false, description: 'Aggressive attacker.' },
  { id: 'mia', name: 'Mia Wind', gender: 'female', avatar: '💨', stats: { speed: 95, power: 50, timing: 85, dink: 70 }, unlockCost: 800, unlocked: false, description: 'Fastest on court.' },
  { id: 'eve', name: 'Eve Precision', gender: 'female', avatar: '⭐', stats: { speed: 75, power: 70, timing: 90, dink: 80 }, unlockCost: 1000, unlocked: false, description: 'Perfect timing.' },
  { id: 'kate', name: 'Kate Queen', gender: 'female', avatar: '👸', stats: { speed: 90, power: 88, timing: 88, dink: 92 }, unlockCost: 2000, unlocked: false, description: 'World champion.' },
];
export const getHeroById = (id: string): Hero => HEROES.find(h => h.id === id) || HEROES[0];
export const getHeroesByGender = (gender: 'male' | 'female'): Hero[] => HEROES.filter(h => h.gender === gender);
export const getUnlockedHeroes = (unlockedIds: string[]): Hero[] => HEROES.filter(h => h.unlocked || unlockedIds.includes(h.id));
