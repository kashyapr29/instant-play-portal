// Storage utilities for Ninja Jump game

import { GameProgress } from './types';

const STORAGE_KEY = 'ninja_jump_progress';

const DEFAULT_PROGRESS: GameProgress = {
  currentLevel: 1,
  highestUnlockedLevel: 1,
  totalStars: 0,
  levelStars: {},
  bestScores: {},
  bestHeights: {},
  totalCoins: 0,
  soundEnabled: true,
  totalJumps: 0,
  totalDeaths: 0,
  achievements: [],
};

export const loadProgress = (): GameProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PROGRESS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return { ...DEFAULT_PROGRESS };
};

export const saveProgress = (progress: GameProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

export const updateBestScore = (levelId: number, score: number): GameProgress => {
  const progress = loadProgress();
  const currentBest = progress.bestScores[levelId] || 0;
  
  if (score > currentBest) {
    progress.bestScores[levelId] = score;
    saveProgress(progress);
  }
  
  return progress;
};

export const updateBestHeight = (levelId: number, height: number): GameProgress => {
  const progress = loadProgress();
  const currentBest = progress.bestHeights[levelId] || 0;
  
  if (height > currentBest) {
    progress.bestHeights[levelId] = height;
    saveProgress(progress);
  }
  
  return progress;
};

export const updateLevelStars = (levelId: number, stars: number): GameProgress => {
  const progress = loadProgress();
  const currentStars = progress.levelStars[levelId] || 0;
  
  if (stars > currentStars) {
    const diff = stars - currentStars;
    progress.levelStars[levelId] = stars;
    progress.totalStars += diff;
    saveProgress(progress);
  }
  
  return progress;
};

export const unlockLevel = (levelId: number): GameProgress => {
  const progress = loadProgress();
  
  if (levelId > progress.highestUnlockedLevel) {
    progress.highestUnlockedLevel = levelId;
    saveProgress(progress);
  }
  
  return progress;
};

export const addCoins = (amount: number): GameProgress => {
  const progress = loadProgress();
  progress.totalCoins += amount;
  saveProgress(progress);
  return progress;
};

export const incrementStats = (type: 'jumps' | 'deaths'): GameProgress => {
  const progress = loadProgress();
  
  if (type === 'jumps') {
    progress.totalJumps++;
  } else if (type === 'deaths') {
    progress.totalDeaths++;
  }
  
  saveProgress(progress);
  return progress;
};

export const addAchievement = (achievement: string): GameProgress => {
  const progress = loadProgress();
  
  if (!progress.achievements.includes(achievement)) {
    progress.achievements.push(achievement);
    saveProgress(progress);
  }
  
  return progress;
};

export const toggleSound = (): GameProgress => {
  const progress = loadProgress();
  progress.soundEnabled = !progress.soundEnabled;
  saveProgress(progress);
  return progress;
};

export const resetProgress = (): GameProgress => {
  const progress = { ...DEFAULT_PROGRESS };
  saveProgress(progress);
  return progress;
};
