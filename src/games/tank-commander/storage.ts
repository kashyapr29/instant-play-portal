import { GameProgress, UPGRADE_CONFIG } from './types';

const STORAGE_KEY = 'tank_commander_progress';

const DEFAULT_PROGRESS: GameProgress = {
  highScore: 0,
  currentMission: 1,
  unlockedMissions: 1,
  totalDestroyed: 0,
  credits: 0,
  upgrades: {
    damage: 1,
    armor: 1,
    speed: 1,
    ammo: 1,
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

export const unlockMission = (mission: number) => {
  const progress = loadProgress();
  if (mission > progress.unlockedMissions) {
    saveProgress({ unlockedMissions: mission });
  }
};

export const updateHighScore = (score: number) => {
  const progress = loadProgress();
  if (score > progress.highScore) {
    saveProgress({ highScore: score });
  }
};

export const addDestroyed = (count: number) => {
  const progress = loadProgress();
  saveProgress({ totalDestroyed: progress.totalDestroyed + count });
};
