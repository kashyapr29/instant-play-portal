// Tank Commander Types

export type Screen = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Tank extends Entity {
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  shells: number;
  maxShells: number;
  weapon: 'cannon' | 'machinegun' | 'missile' | 'flamethrower';
  fireRate: number;
  lastFired: number;
  speed: number;
  armor: number;
  angle: number;
  turretAngle: number;
  isPlayer: boolean;
}

export interface EnemyTank extends Tank {
  id: string;
  type: 'light' | 'medium' | 'heavy' | 'artillery' | 'boss';
  points: number;
  damage: number;
  ai: 'patrol' | 'chase' | 'snipe' | 'aggressive';
  targetX?: number;
  targetY?: number;
  patrolPoints?: { x: number; y: number }[];
  currentPatrolIndex?: number;
}

export interface Projectile extends Entity {
  id: string;
  dx: number;
  dy: number;
  damage: number;
  owner: 'player' | 'enemy';
  type: 'bullet' | 'shell' | 'missile' | 'flame';
  color: string;
  life: number;
}

export interface Obstacle extends Entity {
  id: string;
  type: 'wall' | 'barrel' | 'sandbag' | 'crate';
  health: number;
  destructible: boolean;
}

export interface PowerUp extends Entity {
  id: string;
  type: 'health' | 'ammo' | 'armor' | 'weapon-missile' | 'weapon-flamethrower' | 'shield';
  duration: number;
}

export interface Particle extends Entity {
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'explosion' | 'smoke' | 'spark' | 'debris';
  rotation: number;
  rotationSpeed: number;
}

export interface GameProgress {
  highScore: number;
  currentMission: number;
  unlockedMissions: number;
  totalDestroyed: number;
  credits: number;
  upgrades: {
    damage: number;
    armor: number;
    speed: number;
    ammo: number;
  };
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

export const UPGRADE_CONFIG = {
  damage: { name: 'Firepower', description: 'Increase weapon damage', basePrice: 600, multiplier: 1.5, maxLevel: 10 },
  armor: { name: 'Armor Plating', description: 'Reduce damage taken', basePrice: 500, multiplier: 1.4, maxLevel: 10 },
  speed: { name: 'Engine Power', description: 'Increase tank speed', basePrice: 400, multiplier: 1.3, maxLevel: 8 },
  ammo: { name: 'Ammo Storage', description: 'Carry more ammunition', basePrice: 350, multiplier: 1.35, maxLevel: 8 },
};

export interface GameState {
  screen: Screen;
  score: number;
  mission: number;
  missionProgress: number;
  tanksDestroyed: number;
  powerUpsCollected: number;
  enemiesRemaining: number;
}
