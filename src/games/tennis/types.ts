// Tennis Hero Game Types

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  power: number;
  timing: number;
  spin: number;
  name: string;
  avatar: string;
  isServing: boolean;
  score: number;
  games: number;
  sets: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  spin: number;
  speed: number;
  visible: boolean;
  trajectory: { x: number; y: number }[];
}

export interface Court {
  id: number;
  name: string;
  surface: 'grass' | 'clay' | 'hard' | 'indoor';
  unlockLevel: number;
  bgColors: string[];
  courtColor: string;
  lineColor: string;
  description: string;
}

export interface Hero {
  id: string;
  name: string;
  gender: 'male' | 'female';
  avatar: string;
  stats: {
    speed: number;
    power: number;
    timing: number;
    spin: number;
  };
  unlockCost: number;
  unlocked: boolean;
  description: string;
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  active: boolean;
  duration: number;
  collected: boolean;
}

export type PowerUpType = 
  | 'slow_motion'
  | 'power_smash'
  | 'auto_aim'
  | 'speed_boost'
  | 'multi_hit';

export interface HeroPowerUpgrade {
  level: number; // 1-8
  power: number; // Base power stat
  speed: number; // Base speed stat
  timing: number; // Base timing stat
  spin: number; // Base spin stat
  cost: number; // Coins to upgrade to next level
}

export interface GameProgress {
  coins: number;
  currentLevel: number;
  highestLevel: number;
  unlockedHeroes: string[];
  selectedHero: string;
  completedLevels: number[];
  bestScores: { [levelId: number]: number };
  totalMatches: number;
  totalWins: number;
  totalAces: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  // Career Mode - Missions
  completedMissions: string[]; // Array of mission IDs completed
  heroUpgradeLevel: { [heroId: string]: number }; // Current power level for each hero (1-8)
}

export interface MatchResult {
  won: boolean;
  playerScore: number;
  opponentScore: number;
  aces: number;
  accuracy: number;
  avgReactionTime: number;
  coinsEarned: number;
  powerUpsUsed: number;
}

export interface GameState {
  screen: GameScreen;
  mode: GameMode;
  currentCourt: number;
  player: Player;
  opponent: Player;
  ball: Ball;
  playerScore: [number, number]; // [games, points]
  opponentScore: [number, number];
  serving: 'player' | 'opponent';
  rallyCount: number;
  matchTime: number;
  activePowerUps: { type: PowerUpType; endTime: number }[];
  powerUpsOnCourt: PowerUp[];
  hitWindow: { start: number; end: number } | null;
  lastHitQuality: 'perfect' | 'good' | 'early' | 'late' | 'miss' | null;
  isPaused: boolean;
  slowMotionActive: boolean;
  slowMotionStartTime: number;
  slowMotionDuration: number; // 3 seconds
  clickToHitActive: boolean;
  targetClickPos: { x: number; y: number } | null;
}

export type GameScreen = 
  | 'menu'
  | 'heroSelect'
  | 'countrySelect'
  | 'missionSelect'
  | 'courtSelect'
  | 'modeSelect'
  | 'playing'
  | 'paused'
  | 'matchEnd'
  | 'levelComplete'
  | 'settings'
  | 'tutorial';

export type GameMode = 
  | 'career'
  | 'quickMatch'
  | 'practice'
  | 'challenge';

export interface AIOpponent {
  level: number;
  reactionTime: number;
  accuracy: number;
  aggression: number;
  adaptiveness: number;
  patternMemory: number[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'dust' | 'spark' | 'sweat' | 'confetti';
}
