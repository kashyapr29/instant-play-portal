// Space Shooter Professional Types

export type Screen = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'gameOver' | 'levelComplete' | 'bossIntro';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  lives: number;
  maxLives: number;
  shield: number;
  maxShield: number;
  weapon: 'basic' | 'dual' | 'triple' | 'rocket' | 'laser' | 'spread' | 'pierce';
  fireRate: number;
  lastFired: number;
  speed: number;
}

export interface Enemy extends Entity {
  id: string;
  type: 'asteroid' | 'basic' | 'interceptor' | 'heavy' | 'scout' | 'bomber' | 'boss';
  health: number;
  maxHealth: number;
  speed: number;
  pattern: 'straight' | 'sine' | 'diagonal' | 'homing' | 'boss';
  points: number;
  damage: number;
  lastFired?: number;
  angle?: number;
  color?: string;
}

export interface Bullet extends Entity {
  id: string;
  dx: number;
  dy: number;
  damage: number;
  owner: 'player' | 'enemy';
  color: string;
}

export interface PowerUp extends Entity {
  id: string;
  type: 'weapon-dual' | 'weapon-triple' | 'weapon-rocket' | 'weapon-laser' | 'weapon-spread' | 'weapon-pierce' | 'shield' | 'health';
  duration: number;
}

export interface Particle extends Entity {
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface GameProgress {
  highScore: number;
  currentLevel: number;
  unlockedLevels: number;
  upgrades: {
    damage: number;
    shield: number;
    speed: number;
  };
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

export interface GameState {
  screen: Screen;
  score: number;
  level: number;
  levelProgress: number;
  enemiesDestroyed: number;
  powerUpsCollected: number;
  combo: number;
}
