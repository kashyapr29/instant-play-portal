export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  weapon: Weapon;
  abilities: Ability[];
  energy: number;
  maxEnergy: number;
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  projectileColor: string;
  spread: number;
  projectilesPerShot: number;
  energyCost: number;
}

export interface Ability {
  id: string;
  name: string;
  cooldown: number;
  currentCooldown: number;
  energyCost: number;
  duration: number;
  active: boolean;
  icon: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  size: number;
  isEnemy: boolean;
  trail: Vector2D[];
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  angle: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  type: EnemyType;
  lastAttack: number;
  attackCooldown: number;
  color: string;
  glowColor: string;
  size: number;
  points: number;
  behavior: 'chase' | 'circle' | 'teleport' | 'ranged' | 'boss';
  teleportCooldown?: number;
  lastTeleport?: number;
}

export type EnemyType = 'drone' | 'sentinel' | 'phantom' | 'juggernaut' | 'sniper' | 'boss';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'explosion' | 'spark' | 'trail' | 'shield' | 'energy';
}

export interface PowerUp {
  x: number;
  y: number;
  type: 'health' | 'shield' | 'energy' | 'damage' | 'speed';
  duration: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
}

export interface Wave {
  id: number;
  name: string;
  enemies: WaveEnemy[];
  spawnDelay: number;
  bonusObjective?: string;
}

export interface WaveEnemy {
  type: EnemyType;
  count: number;
  spawnDelay: number;
}

export interface GameState {
  status: 'menu' | 'playing' | 'paused' | 'gameover' | 'victory' | 'waveComplete';
  score: number;
  wave: number;
  enemiesKilled: number;
  timeElapsed: number;
  combo: number;
  maxCombo: number;
  comboTimer: number;
}

export interface GameProgress {
  highScore: number;
  highestWave: number;
  totalKills: number;
  credits: number;
  unlockedWeapons: string[];
  unlockedAbilities: string[];
  upgrades: {
    damage: number;
    health: number;
    shield: number;
    energy: number;
    speed: number;
  };
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    particleIntensity: 'low' | 'medium' | 'high';
  };
}

export const UPGRADE_CONFIG = {
  damage: { name: 'Weapon Damage', description: 'Increase all weapon damage', basePrice: 500, multiplier: 1.5, maxLevel: 10 },
  health: { name: 'Max Health', description: 'Increase maximum health', basePrice: 400, multiplier: 1.4, maxLevel: 10 },
  shield: { name: 'Shield Capacity', description: 'Increase max shield', basePrice: 450, multiplier: 1.4, maxLevel: 10 },
  energy: { name: 'Energy Pool', description: 'Increase max energy', basePrice: 350, multiplier: 1.35, maxLevel: 8 },
  speed: { name: 'Movement Speed', description: 'Move faster', basePrice: 300, multiplier: 1.3, maxLevel: 8 },
};
