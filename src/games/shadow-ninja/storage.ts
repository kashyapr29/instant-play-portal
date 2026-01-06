// Shadow Ninja Fight Storage Utilities

import { GameProgress, BASE_PLAYER_STATS, STAT_UPGRADE_CONFIG } from './types';

const STORAGE_KEY = 'shadow_ninja_fight_progress';

const DEFAULT_PROGRESS: GameProgress = {
  coins: 500,
  xp: 0,
  playerLevel: 1,
  currentLevel: 1,
  highestUnlockedLevel: 1,
  completedLevels: [],
  unlockedAbilities: ['shadow_strike'],
  abilityLevels: { 'shadow_strike': 1 },
  selectedAbilities: ['shadow_strike'],
  playerStats: { ...BASE_PLAYER_STATS },
  statUpgrades: {
    attack: 0,
    defense: 0,
    speed: 0,
    critChance: 0,
    energyRegen: 0,
  },
  totalFights: 0,
  totalWins: 0,
  totalKOs: 0,
  bestCombo: 0,
  completedChallenges: [],
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
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
  return { ...DEFAULT_PROGRESS };
};

export const saveProgress = (progress: GameProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

export const clearProgress = (): GameProgress => {
  const progress = { ...DEFAULT_PROGRESS };
  saveProgress(progress);
  return progress;
};

export const addCoins = (amount: number): GameProgress => {
  const progress = loadProgress();
  progress.coins += amount;
  saveProgress(progress);
  return progress;
};

export const spendCoins = (amount: number): boolean => {
  const progress = loadProgress();
  if (progress.coins >= amount) {
    progress.coins -= amount;
    saveProgress(progress);
    return true;
  }
  return false;
};

export const addXP = (amount: number): GameProgress => {
  const progress = loadProgress();
  progress.xp += amount;
  
  // Level up calculation
  const xpForLevel = (level: number) => Math.floor(100 * Math.pow(1.5, level - 1));
  while (progress.xp >= xpForLevel(progress.playerLevel)) {
    progress.xp -= xpForLevel(progress.playerLevel);
    progress.playerLevel++;
    progress.coins += 100 * progress.playerLevel; // Bonus coins on level up
  }
  
  saveProgress(progress);
  return progress;
};

export const unlockAbility = (abilityId: string, cost: number): boolean => {
  const progress = loadProgress();
  if (progress.coins >= cost && !progress.unlockedAbilities.includes(abilityId)) {
    progress.coins -= cost;
    progress.unlockedAbilities.push(abilityId);
    progress.abilityLevels[abilityId] = 1;
    saveProgress(progress);
    return true;
  }
  return false;
};

export const upgradeAbility = (abilityId: string, cost: number): boolean => {
  const progress = loadProgress();
  const currentLevel = progress.abilityLevels[abilityId] || 1;
  if (progress.coins >= cost && progress.unlockedAbilities.includes(abilityId)) {
    progress.coins -= cost;
    progress.abilityLevels[abilityId] = currentLevel + 1;
    saveProgress(progress);
    return true;
  }
  return false;
};

export const selectAbility = (abilityId: string): GameProgress => {
  const progress = loadProgress();
  if (progress.unlockedAbilities.includes(abilityId)) {
    if (progress.selectedAbilities.includes(abilityId)) {
      progress.selectedAbilities = progress.selectedAbilities.filter(id => id !== abilityId);
    } else if (progress.selectedAbilities.length < 3) {
      progress.selectedAbilities.push(abilityId);
    }
    saveProgress(progress);
  }
  return progress;
};

export const upgradeStat = (statKey: keyof typeof STAT_UPGRADE_CONFIG): boolean => {
  const progress = loadProgress();
  const config = STAT_UPGRADE_CONFIG[statKey];
  const currentLevel = progress.statUpgrades[statKey] || 0;
  
  if (currentLevel >= config.maxLevel) return false;
  
  const cost = Math.floor(config.basePrice * Math.pow(config.multiplier, currentLevel));
  
  if (progress.coins >= cost) {
    progress.coins -= cost;
    progress.statUpgrades[statKey] = currentLevel + 1;
    
    // Update player stats
    (progress.playerStats as any)[statKey] = BASE_PLAYER_STATS[statKey as keyof typeof BASE_PLAYER_STATS] + 
      (currentLevel + 1) * config.perLevel;
    
    saveProgress(progress);
    return true;
  }
  return false;
};

export const completeLevel = (levelId: number, coins: number, xp: number): GameProgress => {
  const progress = loadProgress();
  
  if (!progress.completedLevels.includes(levelId)) {
    progress.completedLevels.push(levelId);
  }
  
  if (levelId >= progress.highestUnlockedLevel && levelId < 15) {
    progress.highestUnlockedLevel = levelId + 1;
  }
  
  progress.coins += coins;
  progress.totalWins++;
  
  // Add XP and handle level up
  addXP(xp);
  
  saveProgress(progress);
  return loadProgress();
};

export const recordFight = (won: boolean, ko: boolean, bestCombo: number): GameProgress => {
  const progress = loadProgress();
  progress.totalFights++;
  if (won) progress.totalWins++;
  if (ko) progress.totalKOs++;
  if (bestCombo > progress.bestCombo) progress.bestCombo = bestCombo;
  saveProgress(progress);
  return progress;
};

export const completeChallenge = (challengeId: string): GameProgress => {
  const progress = loadProgress();
  if (!progress.completedChallenges.includes(challengeId)) {
    progress.completedChallenges.push(challengeId);
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

export const toggleMusic = (): GameProgress => {
  const progress = loadProgress();
  progress.musicEnabled = !progress.musicEnabled;
  saveProgress(progress);
  return progress;
};

export const setDifficulty = (difficulty: 'easy' | 'normal' | 'hard'): GameProgress => {
  const progress = loadProgress();
  progress.difficulty = difficulty;
  saveProgress(progress);
  return progress;
};
