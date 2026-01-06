import { GameProgress } from './types';

const STORAGE_KEY = 'zombie_survival_progress';

const DEFAULT_PROGRESS: GameProgress = {
  highScore: 0,
  currentWave: 1,
  unlockedWaves: 1,
  totalKills: 0,
  credits: 0,
  upgrades: {
    damage: 1,
    health: 1,
    speed: 1,
    ammoCapacity: 1,
  },
  settings: {
    soundEnabled: true,
    musicEnabled: true,
  },
};

export const addCredits = (amount: number) => {
  const progress = loadProgress();
  saveProgress({ credits: progress.credits + amount });
};

export const purchaseUpgrade = (upgradeKey: keyof GameProgress['upgrades']) => {
  const progress = loadProgress();
  const { UPGRADE_CONFIG } = require('./types');
  const config = UPGRADE_CONFIG[upgradeKey];
  const currentLevel = progress.upgrades[upgradeKey];
  const price = Math.floor(config.basePrice * Math.pow(config.multiplier, currentLevel - 1));
  
  if (progress.credits >= price && currentLevel < config.maxLevel) {
    saveProgress({
      credits: progress.credits - price,
      upgrades: { ...progress.upgrades, [upgradeKey]: currentLevel + 1 },
    });
    return true;
  }
  return false;
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

export const unlockWave = (wave: number) => {
  const progress = loadProgress();
  if (wave > progress.unlockedWaves) {
    saveProgress({ unlockedWaves: wave });
  }
};

export const updateHighScore = (score: number) => {
  const progress = loadProgress();
  if (score > progress.highScore) {
    saveProgress({ highScore: score });
  }
};

export const addKills = (kills: number) => {
  const progress = loadProgress();
  saveProgress({ totalKills: progress.totalKills + kills });
};
