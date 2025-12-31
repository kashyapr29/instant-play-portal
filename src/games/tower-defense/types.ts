export interface GameState {
  score: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
}

export interface Tower {
  id: string;
  x: number;
  y: number;
  type: 'basic' | 'sniper' | 'aoe';
  range: number;
  damage: number;
  fireRate: number;
  lastFired: number;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  pathIndex: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: 'normal' | 'fast' | 'boss' | 'elite' | 'void';
}

export interface Projectile {
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
}
