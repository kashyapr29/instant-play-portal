import { GameProgress } from './types';

const STORAGE_KEY = 'space_defender_pro_progress';

const DEFAULT_PROGRESS: GameProgress = {
  highScore: 0,
  currentLevel: 1,
  unlockedLevels: 1,
  upgrades: {
    damage: 1,
    shield: 1,
    speed: 1,
  },
  settings: {
    soundEnabled: true,
    musicEnabled: true,
  },
};

export const loadProgress = (): GameProgress => {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_PROGRESS;
};

export const saveProgress = (progress: Partial<GameProgress>) => {
  const current = loadProgress();
  const updated = { ...current, ...progress };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const unlockLevel = (level: number) => {
  const progress = loadProgress();
  if (level > progress.unlockedLevels) {
    saveProgress({ unlockedLevels: level });
  }
};

export const updateHighScore = (score: number) => {
  const progress = loadProgress();
  if (score > progress.highScore) {
    saveProgress({ highScore: score });
  }
};
