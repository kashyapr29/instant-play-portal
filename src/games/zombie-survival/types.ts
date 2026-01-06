// Zombie Survival Types

export type Screen = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'gameOver' | 'levelComplete' | 'bossIntro';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Player extends Entity {
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  weapon: 'pistol' | 'shotgun' | 'smg' | 'rifle' | 'minigun';
  fireRate: number;
  lastFired: number;
  speed: number;
  armor: number;
  angle: number;
}

export interface Zombie extends Entity {
  id: string;
  type: 'walker' | 'runner' | 'tank' | 'spitter' | 'exploder' | 'boss';
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  points: number;
  angle: number;
  attackCooldown: number;
  lastAttack: number;
}

export interface Bullet extends Entity {
  id: string;
  dx: number;
  dy: number;
  damage: number;
  owner: 'player' | 'zombie';
  color: string;
  pierce: number;
}

export interface PowerUp extends Entity {
  id: string;
  type: 'health' | 'ammo' | 'armor' | 'weapon-shotgun' | 'weapon-smg' | 'weapon-rifle' | 'weapon-minigun' | 'speed';
  duration: number;
}

export interface Particle extends Entity {
  dx: number;
  dy: number;
  life: number;
  maxLife: number;
  color: string;
  type: 'blood' | 'spark' | 'smoke';
}

export interface GameProgress {
  highScore: number;
  currentWave: number;
  unlockedWaves: number;
  totalKills: number;
  credits: number;
  upgrades: {
    damage: number;
    health: number;
    speed: number;
    ammoCapacity: number;
  };
  settings: {
    soundEnabled: boolean;
    musicEnabled: boolean;
  };
}

export const UPGRADE_CONFIG = {
  damage: { name: 'Damage', description: 'Increase bullet damage', basePrice: 500, multiplier: 1.5, maxLevel: 10 },
  health: { name: 'Max Health', description: 'Increase maximum health', basePrice: 400, multiplier: 1.4, maxLevel: 10 },
  speed: { name: 'Movement Speed', description: 'Move faster', basePrice: 300, multiplier: 1.3, maxLevel: 8 },
  ammoCapacity: { name: 'Ammo Capacity', description: 'Carry more ammo', basePrice: 350, multiplier: 1.35, maxLevel: 8 },
};

export interface GameState {
  screen: Screen;
  score: number;
  wave: number;
  waveProgress: number;
  zombiesKilled: number;
  powerUpsCollected: number;
  combo: number;
  zombiesRemaining: number;
}
