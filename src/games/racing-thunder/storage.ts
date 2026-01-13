// Racing Thunder - Storage Module

import { GameProgress, INITIAL_PROGRESS, VehicleStats, XP_PER_LEVEL } from './types';

const STORAGE_KEY = 'racing-thunder-progress';

export function loadProgress(): GameProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_PROGRESS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load Racing Thunder progress:', e);
  }
  return { ...INITIAL_PROGRESS };
}

export function saveProgress(progress: GameProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save Racing Thunder progress:', e);
  }
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function addCoins(amount: number): GameProgress {
  const progress = loadProgress();
  progress.coins += amount;
  saveProgress(progress);
  return progress;
}

export function spendCoins(amount: number): GameProgress | null {
  const progress = loadProgress();
  if (progress.coins >= amount) {
    progress.coins -= amount;
    saveProgress(progress);
    return progress;
  }
  return null;
}

export function addXP(amount: number): GameProgress {
  const progress = loadProgress();
  progress.xp += amount;
  
  // Level up check
  while (progress.xp >= progress.level * XP_PER_LEVEL) {
    progress.xp -= progress.level * XP_PER_LEVEL;
    progress.level++;
    progress.coins += progress.level * 100; // Bonus coins on level up
  }
  
  saveProgress(progress);
  return progress;
}

export function unlockVehicle(vehicleId: string, cost: number): GameProgress | null {
  const progress = loadProgress();
  if (progress.coins >= cost && !progress.unlockedVehicles.includes(vehicleId)) {
    progress.coins -= cost;
    progress.unlockedVehicles.push(vehicleId);
    saveProgress(progress);
    return progress;
  }
  return null;
}

export function unlockTrack(trackId: string, cost: number): GameProgress | null {
  const progress = loadProgress();
  if (progress.coins >= cost && !progress.unlockedTracks.includes(trackId)) {
    progress.coins -= cost;
    progress.unlockedTracks.push(trackId);
    saveProgress(progress);
    return progress;
  }
  return null;
}

export function selectVehicle(vehicleId: string): GameProgress {
  const progress = loadProgress();
  if (progress.unlockedVehicles.includes(vehicleId)) {
    progress.selectedVehicle = vehicleId;
    saveProgress(progress);
  }
  return progress;
}

export function upgradeVehicleStat(
  vehicleId: string, 
  stat: keyof VehicleStats, 
  cost: number
): GameProgress | null {
  const progress = loadProgress();
  if (progress.coins >= cost) {
    progress.coins -= cost;
    if (!progress.vehicleUpgrades[vehicleId]) {
      progress.vehicleUpgrades[vehicleId] = {
        speed: 0,
        acceleration: 0,
        handling: 0,
        nitro: 0,
        durability: 0,
      };
    }
    if (progress.vehicleUpgrades[vehicleId][stat] < 5) {
      progress.vehicleUpgrades[vehicleId][stat]++;
      saveProgress(progress);
      return progress;
    }
  }
  return null;
}

export function recordRaceResult(
  trackId: string,
  time: number,
  position: number,
  distance: number,
  coinsEarned: number,
  xpEarned: number
): GameProgress {
  const progress = loadProgress();
  
  progress.totalRaces++;
  progress.totalDistance += distance;
  if (position === 1) progress.totalWins++;
  
  // Update best time
  if (!progress.trackBestTimes[trackId] || time < progress.trackBestTimes[trackId]) {
    progress.trackBestTimes[trackId] = time;
  }
  
  progress.coins += coinsEarned;
  progress.xp += xpEarned;
  
  // Level up check
  while (progress.xp >= progress.level * XP_PER_LEVEL) {
    progress.xp -= progress.level * XP_PER_LEVEL;
    progress.level++;
    progress.coins += progress.level * 100;
  }
  
  saveProgress(progress);
  return progress;
}

export function completeChallenge(challengeId: string, reward: number): GameProgress {
  const progress = loadProgress();
  if (!progress.completedChallenges.includes(challengeId)) {
    progress.completedChallenges.push(challengeId);
    progress.coins += reward;
    saveProgress(progress);
  }
  return progress;
}

export function toggleSound(): GameProgress {
  const progress = loadProgress();
  progress.soundEnabled = !progress.soundEnabled;
  saveProgress(progress);
  return progress;
}

export function toggleMusic(): GameProgress {
  const progress = loadProgress();
  progress.musicEnabled = !progress.musicEnabled;
  saveProgress(progress);
  return progress;
}

export function addNitroUsed(amount: number): GameProgress {
  const progress = loadProgress();
  progress.totalNitroUsed += amount;
  saveProgress(progress);
  return progress;
}
