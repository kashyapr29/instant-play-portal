// Level definitions for Ninja Jump

import { Level, LevelTheme } from './types';

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Bamboo Grove',
    theme: 'bamboo_forest',
    description: 'Begin your journey through the peaceful bamboo forest.',
    targetScore: 1000,
    timeLimit: 90,
    gravity: 0.5,
    platformFrequency: 0.7,
    obstacleFrequency: 0.1,
    collectibleFrequency: 0.4,
    enemyFrequency: 0,
    bgColors: ['#1a472a', '#2d5a3f', '#0f2818'],
    unlockRequirement: 0,
  },
  {
    id: 2,
    name: 'Cherry Blossom Path',
    theme: 'cherry_blossom',
    description: 'Dance among the falling petals.',
    targetScore: 1500,
    timeLimit: 90,
    gravity: 0.5,
    platformFrequency: 0.65,
    obstacleFrequency: 0.15,
    collectibleFrequency: 0.45,
    enemyFrequency: 0.05,
    specialMechanic: 'Wind gusts push you left and right',
    bgColors: ['#ffb7c5', '#ff69b4', '#c71585'],
    unlockRequirement: 1,
  },
  {
    id: 3,
    name: 'Ancient Temple',
    theme: 'ancient_temple',
    description: 'Explore the mysterious temple ruins.',
    targetScore: 2000,
    timeLimit: 100,
    gravity: 0.52,
    platformFrequency: 0.6,
    obstacleFrequency: 0.2,
    collectibleFrequency: 0.4,
    enemyFrequency: 0.1,
    specialMechanic: 'Crumbling platforms test your reflexes',
    bgColors: ['#4a3728', '#6b4423', '#8b6914'],
    unlockRequirement: 3,
  },
  {
    id: 4,
    name: 'Snowy Peak',
    theme: 'snowy_mountain',
    description: 'Brave the frozen heights.',
    targetScore: 2500,
    timeLimit: 100,
    gravity: 0.48,
    platformFrequency: 0.55,
    obstacleFrequency: 0.25,
    collectibleFrequency: 0.35,
    enemyFrequency: 0.12,
    specialMechanic: 'Ice platforms are slippery!',
    bgColors: ['#e0f4ff', '#b8d4e8', '#87ceeb'],
    unlockRequirement: 5,
  },
  {
    id: 5,
    name: 'Haunted Shrine',
    theme: 'haunted_shrine',
    description: 'Face the spirits of fallen warriors.',
    targetScore: 3000,
    timeLimit: 110,
    gravity: 0.5,
    platformFrequency: 0.5,
    obstacleFrequency: 0.3,
    collectibleFrequency: 0.35,
    enemyFrequency: 0.2,
    specialMechanic: 'Ghost enemies phase through walls',
    bgColors: ['#1a1a2e', '#16213e', '#0f0f1a'],
    unlockRequirement: 8,
  },
  {
    id: 6,
    name: 'Shadow Cave',
    theme: 'dark_cave',
    description: 'Navigate through the darkness.',
    targetScore: 3500,
    timeLimit: 110,
    gravity: 0.52,
    platformFrequency: 0.5,
    obstacleFrequency: 0.35,
    collectibleFrequency: 0.3,
    enemyFrequency: 0.18,
    specialMechanic: 'Limited visibility - collect lanterns for light',
    bgColors: ['#0a0a0f', '#151520', '#1a1a25'],
    unlockRequirement: 11,
  },
  {
    id: 7,
    name: 'Volcanic Forge',
    theme: 'volcano',
    description: 'Survive the burning inferno.',
    targetScore: 4000,
    timeLimit: 100,
    gravity: 0.55,
    platformFrequency: 0.45,
    obstacleFrequency: 0.4,
    collectibleFrequency: 0.35,
    enemyFrequency: 0.2,
    specialMechanic: 'Rising lava pushes you higher',
    bgColors: ['#8b0000', '#cc3300', '#ff4500'],
    unlockRequirement: 14,
  },
  {
    id: 8,
    name: 'Cloud Palace',
    theme: 'cloud_palace',
    description: 'Ascend to the heavens.',
    targetScore: 5000,
    timeLimit: 120,
    gravity: 0.4,
    platformFrequency: 0.55,
    obstacleFrequency: 0.35,
    collectibleFrequency: 0.45,
    enemyFrequency: 0.22,
    specialMechanic: 'Lower gravity lets you jump higher',
    bgColors: ['#f0f8ff', '#e6e6fa', '#dda0dd'],
    unlockRequirement: 18,
  },
];

export const getTotalLevels = (): number => LEVELS.length;

export const getLevelByTheme = (theme: LevelTheme): Level | undefined => {
  return LEVELS.find(level => level.theme === theme);
};

export const getThemeColors = (theme: LevelTheme): { primary: string; secondary: string; accent: string; bg: string[] } => {
  const themeColors: Record<LevelTheme, { primary: string; secondary: string; accent: string; bg: string[] }> = {
    bamboo_forest: {
      primary: '#2d5a3f',
      secondary: '#8fbc8f',
      accent: '#ffd700',
      bg: ['#1a472a', '#2d5a3f', '#0f2818'],
    },
    cherry_blossom: {
      primary: '#ff69b4',
      secondary: '#ffb7c5',
      accent: '#ffffff',
      bg: ['#ffb7c5', '#ff69b4', '#c71585'],
    },
    ancient_temple: {
      primary: '#8b6914',
      secondary: '#d4a574',
      accent: '#ffd700',
      bg: ['#4a3728', '#6b4423', '#8b6914'],
    },
    snowy_mountain: {
      primary: '#87ceeb',
      secondary: '#ffffff',
      accent: '#00bfff',
      bg: ['#e0f4ff', '#b8d4e8', '#87ceeb'],
    },
    haunted_shrine: {
      primary: '#9370db',
      secondary: '#483d8b',
      accent: '#00ff7f',
      bg: ['#1a1a2e', '#16213e', '#0f0f1a'],
    },
    dark_cave: {
      primary: '#4169e1',
      secondary: '#1e3a5f',
      accent: '#ffa500',
      bg: ['#0a0a0f', '#151520', '#1a1a25'],
    },
    volcano: {
      primary: '#ff4500',
      secondary: '#ff6347',
      accent: '#ffd700',
      bg: ['#8b0000', '#cc3300', '#ff4500'],
    },
    cloud_palace: {
      primary: '#dda0dd',
      secondary: '#f0f8ff',
      accent: '#ffd700',
      bg: ['#f0f8ff', '#e6e6fa', '#dda0dd'],
    },
  };

  return themeColors[theme];
};

export const calculateStars = (score: number, targetScore: number, coins: number, height: number): number => {
  let stars = 0;
  
  // Star 1: Reach 50% of target score
  if (score >= targetScore * 0.5) stars++;
  
  // Star 2: Reach 100% of target score
  if (score >= targetScore) stars++;
  
  // Star 3: Exceptional performance (150% score or 50+ coins or 2000+ height)
  if (score >= targetScore * 1.5 || coins >= 50 || height >= 2000) stars++;
  
  return Math.min(stars, 3);
};
