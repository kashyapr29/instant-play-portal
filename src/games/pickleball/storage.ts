import { GameProgress } from './types';
const STORAGE_KEY = 'pickleball_champion_progress';
const DEFAULT_PROGRESS: GameProgress = { coins: 0, currentLevel: 1, highestLevel: 1, unlockedHeroes: ['ben', 'anna'], selectedHero: 'ben', completedLevels: [], bestScores: {}, totalMatches: 0, totalWins: 0, totalDinks: 0, soundEnabled: true, vibrationEnabled: true, difficulty: 'normal', completedMissions: [], heroUpgradeLevel: { 'ben': 1, 'anna': 1 } };
export const storage = {
  get: (): GameProgress => { try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) }; } catch (e) {} return { ...DEFAULT_PROGRESS }; },
  set: (progress: GameProgress): void => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {} },
  reset: (): GameProgress => { const progress = { ...DEFAULT_PROGRESS }; storage.set(progress); return progress; },
  addCoins: (amount: number): GameProgress => { const progress = storage.get(); progress.coins += amount; storage.set(progress); return progress; },
  spendCoins: (amount: number): boolean => { const progress = storage.get(); if (progress.coins >= amount) { progress.coins -= amount; storage.set(progress); return true; } return false; },
  unlockHero: (heroId: string): GameProgress => { const progress = storage.get(); if (!progress.unlockedHeroes.includes(heroId)) { progress.unlockedHeroes.push(heroId); storage.set(progress); } return progress; },
  selectHero: (heroId: string): GameProgress => { const progress = storage.get(); progress.selectedHero = heroId; storage.set(progress); return progress; },
  completeLevel: (levelId: number, score: number): GameProgress => { const progress = storage.get(); if (!progress.completedLevels.includes(levelId)) progress.completedLevels.push(levelId); if (levelId >= progress.highestLevel) progress.highestLevel = levelId + 1; const currentBest = progress.bestScores[levelId] || 0; if (score > currentBest) progress.bestScores[levelId] = score; storage.set(progress); return progress; },
  recordMatch: (won: boolean, dinks: number): GameProgress => { const progress = storage.get(); progress.totalMatches++; if (won) progress.totalWins++; progress.totalDinks += dinks; storage.set(progress); return progress; },
  toggleSound: (): GameProgress => { const progress = storage.get(); progress.soundEnabled = !progress.soundEnabled; storage.set(progress); return progress; },
};
