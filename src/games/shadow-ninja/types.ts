// Shadow Ninja Fight Game Types

export interface Fighter {
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  facing: 'left' | 'right';
  state: FighterState;
  stateTimer: number;
  comboCount: number;
  isBlocking: boolean;
  isStunned: boolean;
  stunTimer: number;
  velocity: { x: number; y: number };
  stats: FighterStats;
}

export interface FighterStats {
  attack: number;
  defense: number;
  speed: number;
  critChance: number;
  energyRegen: number;
}

export type FighterState = 
  | 'idle'
  | 'walking'
  | 'jumping'
  | 'punching'
  | 'kicking'
  | 'special'
  | 'blocking'
  | 'hit'
  | 'knockdown'
  | 'victory'
  | 'defeat';

export interface Enemy {
  id: string;
  name: string;
  title: string;
  avatar: string;
  difficulty: number;
  stats: FighterStats;
  specialMove: string;
  dialogue: {
    intro: string;
    win: string;
    lose: string;
  };
  colors: {
    primary: string;
    secondary: string;
    glow: string;
  };
}

export interface PowerAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'offensive' | 'defensive' | 'utility';
  energyCost: number;
  cooldown: number;
  damage?: number;
  effect?: string;
  unlocked: boolean;
  unlockCost: number;
  level: number;
  maxLevel: number;
  upgradeCost: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  enemyId: string;
  rounds: number;
  background: string;
  unlockRequirement: number;
  rewards: {
    coins: number;
    xp: number;
  };
  challenges: Challenge[];
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'no_damage' | 'time_limit' | 'combo' | 'special_only' | 'no_special';
  target: number;
  reward: number;
  completed: boolean;
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
  type: 'hit' | 'spark' | 'smoke' | 'blood' | 'energy' | 'confetti';
}

export interface HitEffect {
  x: number;
  y: number;
  type: 'punch' | 'kick' | 'special' | 'critical' | 'block';
  damage: number;
  timer: number;
}

export interface GameProgress {
  coins: number;
  xp: number;
  playerLevel: number;
  currentLevel: number;
  highestUnlockedLevel: number;
  completedLevels: number[];
  unlockedAbilities: string[];
  abilityLevels: { [id: string]: number };
  selectedAbilities: string[];
  playerStats: FighterStats;
  statUpgrades: { [key: string]: number };
  totalFights: number;
  totalWins: number;
  totalKOs: number;
  bestCombo: number;
  completedChallenges: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export type GameScreen = 
  | 'menu'
  | 'levelSelect'
  | 'shop'
  | 'abilities'
  | 'stats'
  | 'fighting'
  | 'roundEnd'
  | 'levelComplete'
  | 'gameOver'
  | 'settings'
  | 'tutorial';

export interface GameState {
  screen: GameScreen;
  currentLevel: number;
  currentRound: number;
  totalRounds: number;
  playerWins: number;
  enemyWins: number;
  roundTimer: number;
  isPaused: boolean;
  slowMotion: boolean;
  slowMotionTimer: number;
  comboTimer: number;
  lastHitTime: number;
}

export interface RoundResult {
  winner: 'player' | 'enemy';
  playerHealth: number;
  enemyHealth: number;
  playerDamageDealt: number;
  enemyDamageDealt: number;
  combosLanded: number;
  specialsUsed: number;
  timeElapsed: number;
  perfect: boolean;
}

export interface LevelResult {
  won: boolean;
  rounds: RoundResult[];
  totalCoins: number;
  totalXP: number;
  challengesCompleted: string[];
  newUnlocks: string[];
}

export const STAT_UPGRADE_CONFIG = {
  attack: { name: 'Attack Power', basePrice: 100, multiplier: 1.5, maxLevel: 20, perLevel: 2 },
  defense: { name: 'Defense', basePrice: 100, multiplier: 1.5, maxLevel: 20, perLevel: 1.5 },
  speed: { name: 'Speed', basePrice: 80, multiplier: 1.4, maxLevel: 15, perLevel: 0.5 },
  critChance: { name: 'Critical Chance', basePrice: 150, multiplier: 1.6, maxLevel: 10, perLevel: 3 },
  energyRegen: { name: 'Energy Regen', basePrice: 120, multiplier: 1.5, maxLevel: 10, perLevel: 0.5 },
};

export const BASE_PLAYER_STATS: FighterStats = {
  attack: 10,
  defense: 5,
  speed: 5,
  critChance: 5,
  energyRegen: 2,
};
