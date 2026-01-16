// Galaxy Rider Game Types

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  isJumping: boolean;
  isHeavy: boolean;
  isDead: boolean;
  isFinished: boolean;
}

export interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  type: BlockType;
  color?: string;
}

export type BlockType = 
  | 'normal' 
  | 'ramp' 
  | 'rubber' 
  | 'blackhole' 
  | 'spike' 
  | 'finish' 
  | 'checkpoint' 
  | 'boost' 
  | 'gravity_flip';

export interface Level {
  id: number;
  name: string;
  blocks: Block[];
  spawnX: number;
  spawnY: number;
  gravity: number;
  background: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  starTimes: [number, number, number]; // 3-star, 2-star, 1-star times
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface Trail {
  x: number;
  y: number;
  age: number;
}

export interface GameProgress {
  highestLevel: number;
  unlockedLevels: number[];
  bestTimes: Record<number, number>;
  totalAttempts: number;
  totalDeaths: number;
  totalFinishes: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface GameState {
  screen: Screen;
  level: number;
  time: number;
  attempts: number;
  player: PlayerState;
  particles: Particle[];
  trails: Trail[];
  cameraX: number;
  cameraY: number;
  countdown: number;
  checkpointX: number;
  checkpointY: number;
  gravityFlipped: boolean;
}

export type Screen = 'menu' | 'levels' | 'playing' | 'paused' | 'complete' | 'settings';

export const INITIAL_PROGRESS: GameProgress = {
  highestLevel: 1,
  unlockedLevels: [1],
  bestTimes: {},
  totalAttempts: 0,
  totalDeaths: 0,
  totalFinishes: 0,
  soundEnabled: true,
  musicEnabled: true,
};

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PLAYER_SIZE = 24;
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const MOVE_SPEED = 6;
export const MAX_FALL_SPEED = 15;
export const FRICTION = 0.95;
