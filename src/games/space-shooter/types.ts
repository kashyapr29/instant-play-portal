export interface GameState {
  score: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
  lives: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bullet extends Entity {
  active: boolean;
}

export interface Enemy extends Entity {
  health: number;
  type: 'basic' | 'fast' | 'tank';
}
