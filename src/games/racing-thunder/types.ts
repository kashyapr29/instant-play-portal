// Racing Thunder - Type Definitions

export interface VehicleStats {
  speed: number;        // Max speed (1-10)
  acceleration: number; // How fast it reaches max speed (1-10)
  handling: number;     // Turn responsiveness (1-10)
  nitro: number;        // Nitro boost power (1-10)
  durability: number;   // Collision resistance (1-10)
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'car' | 'bike';
  baseStats: VehicleStats;
  upgradeLevels: VehicleStats;
  unlockCost: number;
  unlocked: boolean;
  color: string;
  accentColor: string;
  description: string;
}

export interface Track {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  laps: number;
  length: number; // In game units
  environment: 'city' | 'desert' | 'mountain' | 'night' | 'beach' | 'snow';
  unlockCost: number;
  unlocked: boolean;
  bestTime: number | null;
  curves: TrackCurve[];
  obstacles: TrackObstacle[];
  powerUpSpawns: { x: number; z: number }[];
}

export interface TrackCurve {
  position: number; // Distance along track
  direction: 'left' | 'right';
  intensity: number; // 1-5
}

export interface TrackObstacle {
  type: 'barrier' | 'oil' | 'cone' | 'rock';
  x: number;
  z: number;
  width: number;
}

export interface PowerUp {
  id: string;
  type: 'nitro' | 'shield' | 'magnet' | 'slowmo' | 'repair';
  x: number;
  z: number;
  collected: boolean;
}

export interface Opponent {
  id: string;
  name: string;
  vehicle: Vehicle;
  x: number;
  z: number;
  speed: number;
  lane: number;
  difficulty: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'time' | 'collect' | 'drift' | 'nitro' | 'no_damage' | 'overtake';
  target: number;
  current: number;
  completed: boolean;
  reward: number;
}

export interface GameProgress {
  coins: number;
  xp: number;
  level: number;
  unlockedVehicles: string[];
  unlockedTracks: string[];
  selectedVehicle: string;
  vehicleUpgrades: Record<string, VehicleStats>;
  trackBestTimes: Record<string, number>;
  completedChallenges: string[];
  totalRaces: number;
  totalWins: number;
  totalDistance: number;
  totalNitroUsed: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface RaceState {
  position: number; // 1st, 2nd, 3rd, etc.
  lap: number;
  totalLaps: number;
  distance: number;
  speed: number;
  maxSpeed: number;
  nitroAmount: number;
  nitroActive: boolean;
  shieldActive: boolean;
  health: number;
  coins: number;
  time: number;
  finished: boolean;
  crashed: boolean;
}

export interface PlayerState {
  x: number;
  z: number;
  speed: number;
  targetSpeed: number;
  lane: number;
  rotation: number;
  driftAngle: number;
  isDrifting: boolean;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'smoke' | 'nitro' | 'coin' | 'dust';
}

export interface GameState {
  screen: 'menu' | 'garage' | 'tracks' | 'racing' | 'paused' | 'results' | 'challenges' | 'settings';
  track: Track | null;
  vehicle: Vehicle | null;
  player: PlayerState;
  opponents: Opponent[];
  powerUps: PowerUp[];
  particles: Particle[];
  race: RaceState;
  countdown: number;
  raceStarted: boolean;
}

export const INITIAL_PROGRESS: GameProgress = {
  coins: 500,
  xp: 0,
  level: 1,
  unlockedVehicles: ['starter-car'],
  unlockedTracks: ['city-streets'],
  selectedVehicle: 'starter-car',
  vehicleUpgrades: {},
  trackBestTimes: {},
  completedChallenges: [],
  totalRaces: 0,
  totalWins: 0,
  totalDistance: 0,
  totalNitroUsed: 0,
  soundEnabled: true,
  musicEnabled: true,
};

export const XP_PER_LEVEL = 1000;
export const LANE_WIDTH = 2.5;
export const TRACK_WIDTH = 10;
