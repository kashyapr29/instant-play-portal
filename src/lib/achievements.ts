export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  game: 'all' | 'zombie' | 'tank' | 'cyber';
  condition: (stats: AchievementStats) => boolean;
  reward: number;
}

export interface AchievementStats {
  totalKills: number;
  totalScore: number;
  highestWave: number;
  highestMission: number;
  gamesPlayed: number;
  upgradesPurchased: number;
  maxedUpgrades: number;
  creditsEarned: number;
  bossesKilled: number;
  powerUpsCollected: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
  claimed: boolean;
}

const STORAGE_KEY = 'game_achievements';

export const ACHIEVEMENTS: Achievement[] = [
  // Kill achievements
  { id: 'first_blood', name: 'First Blood', description: 'Kill your first enemy', icon: '🎯', game: 'all', condition: (s) => s.totalKills >= 1, reward: 10 },
  { id: 'killing_spree', name: 'Killing Spree', description: 'Kill 50 enemies', icon: '💀', game: 'all', condition: (s) => s.totalKills >= 50, reward: 50 },
  { id: 'mass_destruction', name: 'Mass Destruction', description: 'Kill 100 enemies', icon: '🔥', game: 'all', condition: (s) => s.totalKills >= 100, reward: 100 },
  { id: 'terminator', name: 'Terminator', description: 'Kill 500 enemies', icon: '🤖', game: 'all', condition: (s) => s.totalKills >= 500, reward: 250 },
  { id: 'death_dealer', name: 'Death Dealer', description: 'Kill 1000 enemies', icon: '☠️', game: 'all', condition: (s) => s.totalKills >= 1000, reward: 500 },

  // Wave/Mission achievements
  { id: 'survivor', name: 'Survivor', description: 'Reach wave/mission 5', icon: '🛡️', game: 'all', condition: (s) => s.highestWave >= 5 || s.highestMission >= 5, reward: 75 },
  { id: 'veteran', name: 'Veteran', description: 'Reach wave/mission 10', icon: '⭐', game: 'all', condition: (s) => s.highestWave >= 10 || s.highestMission >= 10, reward: 150 },
  { id: 'legend', name: 'Legend', description: 'Reach wave/mission 15', icon: '👑', game: 'all', condition: (s) => s.highestWave >= 15 || s.highestMission >= 15, reward: 300 },

  // Score achievements
  { id: 'score_rookie', name: 'Score Rookie', description: 'Score 1,000 points in a game', icon: '📊', game: 'all', condition: (s) => s.totalScore >= 1000, reward: 25 },
  { id: 'score_master', name: 'Score Master', description: 'Score 10,000 points total', icon: '📈', game: 'all', condition: (s) => s.totalScore >= 10000, reward: 100 },
  { id: 'high_roller', name: 'High Roller', description: 'Score 50,000 points total', icon: '💎', game: 'all', condition: (s) => s.totalScore >= 50000, reward: 250 },

  // Upgrade achievements
  { id: 'first_upgrade', name: 'Getting Stronger', description: 'Purchase your first upgrade', icon: '⬆️', game: 'all', condition: (s) => s.upgradesPurchased >= 1, reward: 20 },
  { id: 'upgrade_addict', name: 'Upgrade Addict', description: 'Purchase 10 upgrades', icon: '💪', game: 'all', condition: (s) => s.upgradesPurchased >= 10, reward: 100 },
  { id: 'maxed_out', name: 'Maxed Out', description: 'Max out any upgrade', icon: '🏆', game: 'all', condition: (s) => s.maxedUpgrades >= 1, reward: 200 },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Max out all upgrades in a game', icon: '✨', game: 'all', condition: (s) => s.maxedUpgrades >= 4, reward: 500 },

  // Special achievements
  { id: 'power_collector', name: 'Power Collector', description: 'Collect 50 power-ups', icon: '🎁', game: 'all', condition: (s) => s.powerUpsCollected >= 50, reward: 75 },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat a boss enemy', icon: '👹', game: 'all', condition: (s) => s.bossesKilled >= 1, reward: 150 },
  { id: 'wealthy', name: 'Wealthy', description: 'Earn 5,000 credits total', icon: '💰', game: 'all', condition: (s) => s.creditsEarned >= 5000, reward: 100 },
];

const DEFAULT_STATS: AchievementStats = {
  totalKills: 0,
  totalScore: 0,
  highestWave: 0,
  highestMission: 0,
  gamesPlayed: 0,
  upgradesPurchased: 0,
  maxedUpgrades: 0,
  creditsEarned: 0,
  bossesKilled: 0,
  powerUpsCollected: 0,
};

interface AchievementData {
  stats: AchievementStats;
  unlocked: UnlockedAchievement[];
}

export const loadAchievementData = (): AchievementData => {
  if (typeof window === 'undefined') return { stats: DEFAULT_STATS, unlocked: [] };
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : { stats: DEFAULT_STATS, unlocked: [] };
};

export const saveAchievementData = (data: Partial<AchievementData>) => {
  const current = loadAchievementData();
  const updated = { ...current, ...data };
  if (data.stats) {
    updated.stats = { ...current.stats, ...data.stats };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const updateStats = (updates: Partial<AchievementStats>) => {
  const current = loadAchievementData();
  const newStats = { ...current.stats };
  
  Object.entries(updates).forEach(([key, value]) => {
    if (key.startsWith('highest')) {
      newStats[key as keyof AchievementStats] = Math.max(
        newStats[key as keyof AchievementStats] as number, 
        value as number
      );
    } else {
      (newStats[key as keyof AchievementStats] as number) += value as number;
    }
  });
  
  saveAchievementData({ stats: newStats });
  return checkAchievements();
};

export const checkAchievements = (): Achievement[] => {
  const data = loadAchievementData();
  const newlyUnlocked: Achievement[] = [];

  ACHIEVEMENTS.forEach(achievement => {
    const alreadyUnlocked = data.unlocked.some(u => u.id === achievement.id);
    if (!alreadyUnlocked && achievement.condition(data.stats)) {
      data.unlocked.push({ id: achievement.id, unlockedAt: Date.now(), claimed: false });
      newlyUnlocked.push(achievement);
    }
  });

  if (newlyUnlocked.length > 0) {
    saveAchievementData({ unlocked: data.unlocked });
  }

  return newlyUnlocked;
};

export const claimAchievementReward = (achievementId: string): number => {
  const data = loadAchievementData();
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  const unlockedAchievement = data.unlocked.find(u => u.id === achievementId);

  if (!achievement || !unlockedAchievement || unlockedAchievement.claimed) {
    return 0;
  }

  unlockedAchievement.claimed = true;
  saveAchievementData({ unlocked: data.unlocked });
  
  return achievement.reward;
};

export const getAchievementProgress = () => {
  const data = loadAchievementData();
  return {
    stats: data.stats,
    unlocked: data.unlocked,
    total: ACHIEVEMENTS.length,
    unlockedCount: data.unlocked.length,
    unclaimedCount: data.unlocked.filter(u => !u.claimed).length,
  };
};
