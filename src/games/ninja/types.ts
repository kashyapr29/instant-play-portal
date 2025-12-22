// Ninja Jump Game Types

export interface Ninja {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facingRight: boolean;
  isJumping: boolean;
  isWallSliding: boolean;
  wallSide: 'left' | 'right' | null;
  isDashing: boolean;
  dashCooldown: number;
  invincible: boolean;
  invincibleTimer: number;
  combo: number;
  maxCombo: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  moving?: boolean;
  moveSpeed?: number;
  moveRange?: number;
  startX?: number;
  crumbling?: boolean;
  crumbleTimer?: number;
}

export type PlatformType = 
  | 'normal' 
  | 'ice' 
  | 'bouncy' 
  | 'crumbling' 
  | 'moving' 
  | 'spike' 
  | 'checkpoint'
  | 'bamboo'
  | 'stone'
  | 'wood';

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ObstacleType;
  active: boolean;
  rotation?: number;
  speed?: number;
  pattern?: 'horizontal' | 'vertical' | 'circular';
}

export type ObstacleType = 
  | 'shuriken' 
  | 'spike' 
  | 'fire' 
  | 'arrow' 
  | 'fallingRock'
  | 'swingingBlade'
  | 'laser';

export interface Collectible {
  x: number;
  y: number;
  type: CollectibleType;
  collected: boolean;
  value: number;
  rotation: number;
}

export type CollectibleType = 
  | 'coin' 
  | 'gem' 
  | 'scroll' 
  | 'powerup_speed' 
  | 'powerup_jump' 
  | 'powerup_shield'
  | 'powerup_magnet'
  | 'health';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'dust' | 'spark' | 'leaf' | 'smoke' | 'star' | 'trail';
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  type: EnemyType;
  health: number;
  active: boolean;
  facingRight: boolean;
  patrolStart: number;
  patrolEnd: number;
  speed: number;
}

export type EnemyType = 
  | 'guard' 
  | 'archer' 
  | 'samurai' 
  | 'ghost'
  | 'crow';

export interface Level {
  id: number;
  name: string;
  theme: LevelTheme;
  description: string;
  targetScore: number;
  timeLimit: number; // seconds
  gravity: number;
  platformFrequency: number;
  obstacleFrequency: number;
  collectibleFrequency: number;
  enemyFrequency: number;
  specialMechanic?: string;
  bgColors: string[];
  unlockRequirement: number; // stars needed
}

export type LevelTheme = 
  | 'bamboo_forest' 
  | 'ancient_temple' 
  | 'snowy_mountain' 
  | 'dark_cave' 
  | 'volcano' 
  | 'cloud_palace'
  | 'cherry_blossom'
  | 'haunted_shrine';

export interface GameProgress {
  currentLevel: number;
  highestUnlockedLevel: number;
  totalStars: number;
  levelStars: { [levelId: number]: number };
  bestScores: { [levelId: number]: number };
  bestHeights: { [levelId: number]: number };
  totalCoins: number;
  soundEnabled: boolean;
  totalJumps: number;
  totalDeaths: number;
  achievements: string[];
}

export type GameScreen = 
  | 'menu' 
  | 'levelSelect' 
  | 'playing' 
  | 'paused' 
  | 'gameOver' 
  | 'levelComplete'
  | 'tutorial';

export interface GameState {
  screen: GameScreen;
  score: number;
  coins: number;
  height: number;
  maxHeight: number;
  level: number;
  lives: number;
  timeRemaining: number;
  activePowerUps: { type: CollectibleType; endTime: number }[];
  stars: number;
}

export interface PowerUpEffect {
  type: CollectibleType;
  duration: number;
  multiplier?: number;
}

export interface BackgroundElement {
  x: number;
  y: number;
  type: 'cloud' | 'bird' | 'leaf' | 'lantern' | 'torii' | 'mountain' | 'tree' | 'pagoda';
  speed: number;
  scale: number;
  opacity: number;
}
