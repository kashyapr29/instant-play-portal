// Badminton Smash Game Types

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  power: number;
  timing: number;
  smash: number;
  name: string;
  avatar: string;
  isServing: boolean;
  score: number;
  games: number;
  sets: number;
}

export interface Shuttlecock {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  spin: number;
  speed: number;
  visible: boolean;
  trajectory: { x: number; y: number }[];
  isSmash: boolean;
}

export interface Court {
  id: number;
  name: string;
  type: 'indoor' | 'outdoor' | 'stadium' | 'olympic';
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
    smash: number;
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
  | 'double_points';

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
  totalSmashes: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  completedMissions: string[];
  heroUpgradeLevel: { [heroId: string]: number };
}

export interface MatchResult {
  won: boolean;
  playerScore: number;
  opponentScore: number;
  smashes: number;
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
  shuttlecock: Shuttlecock;
  playerScore: [number, number];
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
  slowMotionDuration: number;
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

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'feather' | 'spark' | 'sweat' | 'confetti';
}
