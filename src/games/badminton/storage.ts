// Badminton Smash Storage Utilities

import { GameProgress } from './types';

const STORAGE_KEY = 'badminton_smash_progress';

const DEFAULT_PROGRESS: GameProgress = {
  coins: 0,
  currentLevel: 1,
  highestLevel: 1,
  unlockedHeroes: ['lee', 'mei'],
  selectedHero: 'lee',
  completedLevels: [],
  bestScores: {},
  totalMatches: 0,
  totalWins: 0,
  totalSmashes: 0,
  soundEnabled: true,
  vibrationEnabled: true,
  difficulty: 'normal',
  completedMissions: [],
  heroUpgradeLevel: { 'lee': 1, 'mei': 1 },
};

export const storage = {
  get: (): GameProgress => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load badminton progress:', e);
    }
    return { ...DEFAULT_PROGRESS };
  },

  set: (progress: GameProgress): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save badminton progress:', e);
    }
  },

  loadProgress: (): GameProgress => {
    return storage.get();
  },

  saveProgress: (progress: GameProgress): void => {
    storage.set(progress);
  },

  reset: (): GameProgress => {
    const progress = { ...DEFAULT_PROGRESS };
    storage.set(progress);
    return progress;
  },

  clearProgress: (): GameProgress => {
    return storage.reset();
  },

  addCoins: (amount: number): GameProgress => {
    const progress = storage.get();
    progress.coins += amount;
    storage.set(progress);
    return progress;
  },

  spendCoins: (amount: number): boolean => {
    const progress = storage.get();
    if (progress.coins >= amount) {
      progress.coins -= amount;
      storage.set(progress);
      return true;
    }
    return false;
  },

  unlockHero: (heroId: string): GameProgress => {
    const progress = storage.get();
    if (!progress.unlockedHeroes.includes(heroId)) {
      progress.unlockedHeroes.push(heroId);
      storage.set(progress);
    }
    return progress;
  },

  selectHero: (heroId: string): GameProgress => {
    const progress = storage.get();
    progress.selectedHero = heroId;
    storage.set(progress);
    return progress;
  },

  completeLevel: (levelId: number, score: number): GameProgress => {
    const progress = storage.get();
    if (!progress.completedLevels.includes(levelId)) {
      progress.completedLevels.push(levelId);
    }
    if (levelId >= progress.highestLevel) {
      progress.highestLevel = levelId + 1;
    }
    const currentBest = progress.bestScores[levelId] || 0;
    if (score > currentBest) {
      progress.bestScores[levelId] = score;
    }
    storage.set(progress);
    return progress;
  },

  recordMatch: (won: boolean, smashes: number): GameProgress => {
    const progress = storage.get();
    progress.totalMatches++;
    if (won) progress.totalWins++;
    progress.totalSmashes += smashes;
    storage.set(progress);
    return progress;
  },

  toggleSound: (): GameProgress => {
    const progress = storage.get();
    progress.soundEnabled = !progress.soundEnabled;
    storage.set(progress);
    return progress;
  },

  toggleVibration: (): GameProgress => {
    const progress = storage.get();
    progress.vibrationEnabled = !progress.vibrationEnabled;
    storage.set(progress);
    return progress;
  },

  setDifficulty: (difficulty: 'easy' | 'normal' | 'hard'): GameProgress => {
    const progress = storage.get();
    progress.difficulty = difficulty;
    storage.set(progress);
    return progress;
  },

  completeMission: (missionId: string): GameProgress => {
    const progress = storage.get();
    if (!progress.completedMissions.includes(missionId)) {
      progress.completedMissions.push(missionId);
      storage.set(progress);
    }
    return progress;
  },

  upgradeHeroPower: (heroId: string, cost: number): boolean => {
    const progress = storage.get();
    if (progress.coins >= cost && (progress.heroUpgradeLevel[heroId] || 1) < 8) {
      progress.coins -= cost;
      progress.heroUpgradeLevel[heroId] = (progress.heroUpgradeLevel[heroId] || 1) + 1;
      storage.set(progress);
      return true;
    }
    return false;
  },

  getHeroPowerLevel: (heroId: string): number => {
    const progress = storage.get();
    return progress.heroUpgradeLevel[heroId] || 1;
  },
};
