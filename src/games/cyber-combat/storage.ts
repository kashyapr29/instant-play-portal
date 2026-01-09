import { GameProgress } from './types';

const STORAGE_KEY = 'cyber_combat_progress';

const DEFAULT_PROGRESS: GameProgress = {
  highScore: 0,
  highestWave: 0,
  totalKills: 0,
  credits: 0,
  unlockedWeapons: ['pulse_rifle'],
  unlockedAbilities: ['dash'],
  upgrades: {
    damage: 1,
    health: 1,
    shield: 1,
    energy: 1,
    speed: 1,
  },
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    particleIntensity: 'high',
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
  return saved ? { ...DEFAULT_PROGRESS, ...JSON.parse(saved) } : DEFAULT_PROGRESS;
};

export const saveProgress = (progress: Partial<GameProgress>) => {
  const current = loadProgress();
  const updated = { ...current, ...progress };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateHighScore = (score: number) => {
  const progress = loadProgress();
  if (score > progress.highScore) {
    saveProgress({ highScore: score });
    return true;
  }
  return false;
};

export const updateHighestWave = (wave: number) => {
  const progress = loadProgress();
  if (wave > progress.highestWave) {
    saveProgress({ highestWave: wave });
  }
};

export const addKills = (count: number) => {
  const progress = loadProgress();
  saveProgress({ totalKills: progress.totalKills + count });
};

export const unlockWeapon = (weaponId: string) => {
  const progress = loadProgress();
  if (!progress.unlockedWeapons.includes(weaponId)) {
    saveProgress({ unlockedWeapons: [...progress.unlockedWeapons, weaponId] });
  }
};

export const unlockAbility = (abilityId: string) => {
  const progress = loadProgress();
  if (!progress.unlockedAbilities.includes(abilityId)) {
    saveProgress({ unlockedAbilities: [...progress.unlockedAbilities, abilityId] });
  }
};
