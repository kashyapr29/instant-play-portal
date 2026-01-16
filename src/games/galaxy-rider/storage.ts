// Galaxy Rider Storage Manager

import { GameProgress, INITIAL_PROGRESS } from './types';

const STORAGE_KEY = 'galaxyRiderProgress';

export const loadProgress = (): GameProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...INITIAL_PROGRESS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load progress:', error);
  }
  return { ...INITIAL_PROGRESS };
};

export const saveProgress = (updates: Partial<GameProgress>) => {
  try {
    const current = loadProgress();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to save progress:', error);
    return loadProgress();
  }
};

export const unlockLevel = (level: number) => {
  const current = loadProgress();
  if (!current.unlockedLevels.includes(level)) {
    const newUnlocked = [...current.unlockedLevels, level];
    saveProgress({
      unlockedLevels: newUnlocked,
      highestLevel: Math.max(current.highestLevel, level),
    });
  }
};

export const saveBestTime = (level: number, time: number): boolean => {
  const current = loadProgress();
  const currentBest = current.bestTimes[level];
  if (!currentBest || time < currentBest) {
    saveProgress({
      bestTimes: { ...current.bestTimes, [level]: time },
    });
    return true;
  }
  return false;
};

export const incrementAttempts = () => {
  const current = loadProgress();
  saveProgress({ totalAttempts: current.totalAttempts + 1 });
};

export const incrementDeaths = () => {
  const current = loadProgress();
  saveProgress({ totalDeaths: current.totalDeaths + 1 });
};

export const incrementFinishes = () => {
  const current = loadProgress();
  saveProgress({ totalFinishes: current.totalFinishes + 1 });
};

export const toggleSound = (): boolean => {
  const current = loadProgress();
  saveProgress({ soundEnabled: !current.soundEnabled });
  return !current.soundEnabled;
};

export const toggleMusic = (): boolean => {
  const current = loadProgress();
  saveProgress({ musicEnabled: !current.musicEnabled });
  return !current.musicEnabled;
};

export const clearProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { ...INITIAL_PROGRESS };
};
