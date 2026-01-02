// Table Tennis (Ping Pong) Game Types

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
  bounceCount: number;
}

export interface Table {
  id: number;
  name: string;
  type: 'practice' | 'club' | 'tournament' | 'olympic';
  unlockLevel: number;
  bgColors: string[];
  tableColor: string;
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
  | 'power_shot'
  | 'auto_aim'
  | 'speed_boost'
  | 'super_spin';

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
  totalSpins: number;
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
  spins: number;
  accuracy: number;
  avgReactionTime: number;
  coinsEarned: number;
  powerUpsUsed: number;
}

export interface GameState {
  screen: GameScreen;
  mode: GameMode;
  currentTable: number;
  player: Player;
  opponent: Player;
  ball: Ball;
  playerScore: [number, number];
  opponentScore: [number, number];
  serving: 'player' | 'opponent';
  serveCount: number;
  rallyCount: number;
  matchTime: number;
  activePowerUps: { type: PowerUpType; endTime: number }[];
  powerUpsOnTable: PowerUp[];
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
  | 'tableSelect'
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
  type: 'bounce' | 'spark' | 'sweat' | 'confetti';
}
