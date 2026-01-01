import { Enemy } from "./types";

export interface LevelConfig {
  id: number;
  name: string;
  targetScore: number;
  spawnRate: number;
  asteroidChance: number;
  enemyTypes: Enemy["type"][];
  bossId?: string;
  background: string;
}

export const LEVELS: LevelConfig[] = [
  // Sector 1: Nebula Outpost
  {
    id: 1,
    name: "Nebula Sector 1-1",
    targetScore: 300,
    spawnRate: 2000,
    asteroidChance: 0.8,
    enemyTypes: ["asteroid", "basic"],
    background: "nebula",
  },
  {
    id: 2,
    name: "Nebula Sector 1-2",
    targetScore: 600,
    spawnRate: 1800,
    asteroidChance: 0.7,
    enemyTypes: ["asteroid", "basic", "scout"],
    background: "nebula",
  },
  {
    id: 3,
    name: "Nebula Sector 1-3",
    targetScore: 1000,
    spawnRate: 1600,
    asteroidChance: 0.6,
    enemyTypes: ["basic", "scout", "interceptor"],
    background: "nebula",
  },
  {
    id: 4,
    name: "Nebula Sector 1-4",
    targetScore: 1500,
    spawnRate: 1400,
    asteroidChance: 0.5,
    enemyTypes: ["scout", "interceptor", "heavy"],
    background: "nebula",
  },
  {
    id: 5,
    name: "Nebula Boss",
    targetScore: 2500,
    spawnRate: 2500,
    asteroidChance: 0.2,
    enemyTypes: ["basic"],
    bossId: "nebula-prime",
    background: "nebula",
  },

  // Sector 2: Asteroid Belt
  {
    id: 6,
    name: "Belt Sector 2-1",
    targetScore: 3500,
    spawnRate: 1500,
    asteroidChance: 0.9,
    enemyTypes: ["asteroid", "scout"],
    background: "asteroid-belt",
  },
  {
    id: 7,
    name: "Belt Sector 2-2",
    targetScore: 4500,
    spawnRate: 1300,
    asteroidChance: 0.85,
    enemyTypes: ["asteroid", "interceptor"],
    background: "asteroid-belt",
  },
  {
    id: 8,
    name: "Belt Sector 2-3",
    targetScore: 5500,
    spawnRate: 1200,
    asteroidChance: 0.8,
    enemyTypes: ["asteroid", "heavy", "bomber"],
    background: "asteroid-belt",
  },
  {
    id: 9,
    name: "Belt Sector 2-4",
    targetScore: 7000,
    spawnRate: 1100,
    asteroidChance: 0.7,
    enemyTypes: ["interceptor", "heavy", "bomber"],
    background: "asteroid-belt",
  },
  {
    id: 10,
    name: "Belt Boss",
    targetScore: 9000,
    spawnRate: 2000,
    asteroidChance: 0.4,
    enemyTypes: ["asteroid"],
    bossId: "belt-crusher",
    background: "asteroid-belt",
  },

  // Sector 3: Alien Territory
  {
    id: 11,
    name: "Deep Space 3-1",
    targetScore: 11000,
    spawnRate: 1100,
    asteroidChance: 0.3,
    enemyTypes: ["basic", "scout"],
    background: "deep-space",
  },
  {
    id: 12,
    name: "Deep Space 3-2",
    targetScore: 13000,
    spawnRate: 1000,
    asteroidChance: 0.2,
    enemyTypes: ["interceptor", "bomber"],
    background: "deep-space",
  },
  {
    id: 13,
    name: "Deep Space 3-3",
    targetScore: 16000,
    spawnRate: 900,
    asteroidChance: 0.2,
    enemyTypes: ["heavy", "interceptor"],
    background: "deep-space",
  },
  {
    id: 14,
    name: "Deep Space 3-4",
    targetScore: 20000,
    spawnRate: 800,
    asteroidChance: 0.1,
    enemyTypes: ["heavy", "bomber", "scout"],
    background: "deep-space",
  },
  {
    id: 15,
    name: "Territory Overlord",
    targetScore: 25000,
    spawnRate: 1500,
    asteroidChance: 0.0,
    enemyTypes: ["interceptor"],
    bossId: "overlord",
    background: "deep-space",
  },
];
