// Fruit Ninja Storage Manager

import { GameProgress, INITIAL_PROGRESS } from './types';

const STORAGE_KEY = 'fruitNinjaProgress';

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

export const updateHighScore = (score: number): boolean => {
  const current = loadProgress();
  if (score > current.highScore) {
    saveProgress({ highScore: score });
    return true;
  }
  return false;
};

export const updateBestCombo = (combo: number): boolean => {
  const current = loadProgress();
  if (combo > current.bestCombo) {
    saveProgress({ bestCombo: combo });
    return true;
  }
  return false;
};

export const incrementStats = (fruitsSliced: number) => {
  const current = loadProgress();
  saveProgress({
    totalFruitsSliced: current.totalFruitsSliced + fruitsSliced,
    totalGamesPlayed: current.totalGamesPlayed + 1,
  });
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

export const resetProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  return { ...INITIAL_PROGRESS };
};
