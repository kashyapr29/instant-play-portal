// Fruit Ninja Game Types

export interface Fruit {
  id: number;
  x: number;
  y: number;
  xSpeed: number;
  ySpeed: number;
  size: number;
  type: FruitType;
  sliced: boolean;
  visible: boolean;
  rotation: number;
  rotationSpeed: number;
}

export type FruitType = 'apple' | 'banana' | 'peach' | 'strawberry' | 'watermelon' | 'bomb';

export interface SliceTrail {
  x: number;
  y: number;
  age: number;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface JuiceSplash {
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
}

export interface SlicedFruitHalf {
  x: number;
  y: number;
  xSpeed: number;
  ySpeed: number;
  rotation: number;
  rotationSpeed: number;
  type: FruitType;
  isLeft: boolean;
  life: number;
}

export interface Combo {
  count: number;
  timer: number;
  x: number;
  y: number;
}

export interface GameProgress {
  highScore: number;
  totalFruitsSliced: number;
  totalGamesPlayed: number;
  bestCombo: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export type GameScreen = 'menu' | 'playing' | 'paused' | 'gameOver';

export interface GameState {
  screen: GameScreen;
  score: number;
  lives: number;
  combo: number;
  comboTimer: number;
  difficulty: number;
}

export const INITIAL_PROGRESS: GameProgress = {
  highScore: 0,
  totalFruitsSliced: 0,
  totalGamesPlayed: 0,
  bestCombo: 0,
  soundEnabled: true,
  musicEnabled: true,
};

export const FRUIT_COLORS: Record<FruitType, string> = {
  apple: '#e74c3c',
  banana: '#f1c40f',
  peach: '#e67e22',
  strawberry: '#c0392b',
  watermelon: '#27ae60',
  bomb: '#2c3e50',
};

export const FRUIT_INNER_COLORS: Record<FruitType, string> = {
  apple: '#f5f5dc',
  banana: '#fffacd',
  peach: '#ffefd5',
  strawberry: '#ffcccb',
  watermelon: '#ff6b6b',
  bomb: '#e74c3c',
};

export const GRAVITY = 0.25;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
