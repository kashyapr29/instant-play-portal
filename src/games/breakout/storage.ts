import { GameProgress } from './types';

const STORAGE_KEY = 'breakout_pro_progress';

const DEFAULT_PROGRESS: GameProgress = {
  currentLevel: 1,
  highestUnlockedLevel: 1,
  bestScore: 0,
  soundEnabled: true,
  totalBricksDestroyed: 0,
  totalGamesPlayed: 0,
};

export const loadProgress = (): GameProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return DEFAULT_PROGRESS;
};

export const saveProgress = (progress: Partial<GameProgress>): void => {
  try {
    const current = loadProgress();
    const updated = { ...current, ...progress };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

export const updateBestScore = (score: number): boolean => {
  const current = loadProgress();
  if (score > current.bestScore) {
    saveProgress({ bestScore: score });
    return true;
  }
  return false;
};

export const unlockLevel = (level: number): void => {
  const current = loadProgress();
  if (level > current.highestUnlockedLevel) {
    saveProgress({ highestUnlockedLevel: level });
  }
};

export const resetProgress = (): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROGRESS));
};

export const incrementStats = (bricksDestroyed: number): void => {
  const current = loadProgress();
  saveProgress({
    totalBricksDestroyed: current.totalBricksDestroyed + bricksDestroyed,
    totalGamesPlayed: current.totalGamesPlayed + 1,
  });
};
