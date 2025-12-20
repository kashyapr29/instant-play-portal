// Breakout Game Types

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  trail: { x: number; y: number }[];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  health: number;
  maxHealth: number;
  type: BrickType;
  color: string;
  glowColor: string;
}

export type BrickType = 'normal' | 'strong' | 'unbreakable' | 'explosive' | 'powerup';

export interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  active: boolean;
}

export type PowerUpType = 'multiball' | 'widePaddle' | 'slowMotion' | 'fireball' | 'extraLife';

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Level {
  id: number;
  name: string;
  layout: (number | string)[][];
  ballSpeed: number;
  description: string;
}

export interface GameProgress {
  currentLevel: number;
  highestUnlockedLevel: number;
  bestScore: number;
  soundEnabled: boolean;
  totalBricksDestroyed: number;
  totalGamesPlayed: number;
}

export type GameScreen = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';

export interface GameState {
  screen: GameScreen;
  score: number;
  lives: number;
  level: number;
  combo: number;
  activePowerUps: { type: PowerUpType; endTime: number }[];
}
