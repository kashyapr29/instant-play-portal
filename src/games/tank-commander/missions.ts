import { EnemyTank } from "./types";

export interface MissionConfig {
  id: number;
  name: string;
  enemyCount: number;
  spawnRate: number;
  enemyTypes: EnemyTank["type"][];
  hasObstacles: boolean;
  background: string;
  bossLevel?: boolean;
}

export const MISSIONS: MissionConfig[] = [
  // Campaign 1: Desert Storm
  {
    id: 1,
    name: "Desert Patrol",
    enemyCount: 5,
    spawnRate: 5000,
    enemyTypes: ["light"],
    hasObstacles: true,
    background: "desert",
  },
  {
    id: 2,
    name: "Sand Dunes",
    enemyCount: 8,
    spawnRate: 4500,
    enemyTypes: ["light", "light", "medium"],
    hasObstacles: true,
    background: "desert",
  },
  {
    id: 3,
    name: "Oasis Ambush",
    enemyCount: 10,
    spawnRate: 4000,
    enemyTypes: ["light", "medium"],
    hasObstacles: true,
    background: "desert",
  },
  {
    id: 4,
    name: "Sandstorm",
    enemyCount: 12,
    spawnRate: 3500,
    enemyTypes: ["medium", "artillery"],
    hasObstacles: true,
    background: "desert",
  },
  {
    id: 5,
    name: "Desert Titan",
    enemyCount: 8,
    spawnRate: 4000,
    enemyTypes: ["heavy"],
    hasObstacles: false,
    background: "desert",
    bossLevel: true,
  },
  // Campaign 2: Urban Warfare
  {
    id: 6,
    name: "City Streets",
    enemyCount: 10,
    spawnRate: 4000,
    enemyTypes: ["light", "medium"],
    hasObstacles: true,
    background: "urban",
  },
  {
    id: 7,
    name: "Industrial Zone",
    enemyCount: 12,
    spawnRate: 3500,
    enemyTypes: ["medium", "heavy"],
    hasObstacles: true,
    background: "urban",
  },
  {
    id: 8,
    name: "Downtown",
    enemyCount: 15,
    spawnRate: 3000,
    enemyTypes: ["medium", "artillery", "heavy"],
    hasObstacles: true,
    background: "urban",
  },
  {
    id: 9,
    name: "Bridge Battle",
    enemyCount: 18,
    spawnRate: 2800,
    enemyTypes: ["heavy", "artillery"],
    hasObstacles: true,
    background: "urban",
  },
  {
    id: 10,
    name: "Urban Crusher",
    enemyCount: 10,
    spawnRate: 3500,
    enemyTypes: ["boss"],
    hasObstacles: false,
    background: "urban",
    bossLevel: true,
  },
  // Campaign 3: Arctic Assault
  {
    id: 11,
    name: "Frozen Outpost",
    enemyCount: 15,
    spawnRate: 3000,
    enemyTypes: ["medium", "heavy"],
    hasObstacles: true,
    background: "arctic",
  },
  {
    id: 12,
    name: "Ice Fields",
    enemyCount: 18,
    spawnRate: 2800,
    enemyTypes: ["heavy", "artillery"],
    hasObstacles: true,
    background: "arctic",
  },
  {
    id: 13,
    name: "Blizzard",
    enemyCount: 20,
    spawnRate: 2500,
    enemyTypes: ["medium", "heavy", "artillery"],
    hasObstacles: true,
    background: "arctic",
  },
  {
    id: 14,
    name: "Final Push",
    enemyCount: 25,
    spawnRate: 2200,
    enemyTypes: ["heavy", "artillery"],
    hasObstacles: true,
    background: "arctic",
  },
  {
    id: 15,
    name: "Arctic Behemoth",
    enemyCount: 12,
    spawnRate: 3000,
    enemyTypes: ["boss"],
    hasObstacles: false,
    background: "arctic",
    bossLevel: true,
  },
];

export const getEnemyStats = (type: EnemyTank["type"], mission: number) => {
  const missionMul = 1 + (mission - 1) * 0.1;
  
  switch (type) {
    case "light":
      return {
        health: Math.round(50 * missionMul),
        speed: 2 + mission * 0.05,
        damage: Math.round(10 * missionMul),
        points: 50,
        width: 40,
        height: 40,
        fireRate: 2000,
        ai: 'chase' as const,
      };
    case "medium":
      return {
        health: Math.round(100 * missionMul),
        speed: 1.5 + mission * 0.03,
        damage: Math.round(20 * missionMul),
        points: 100,
        width: 50,
        height: 50,
        fireRate: 1500,
        ai: 'aggressive' as const,
      };
    case "heavy":
      return {
        health: Math.round(200 * missionMul),
        speed: 0.8 + mission * 0.02,
        damage: Math.round(40 * missionMul),
        points: 200,
        width: 60,
        height: 60,
        fireRate: 2500,
        ai: 'aggressive' as const,
      };
    case "artillery":
      return {
        health: Math.round(80 * missionMul),
        speed: 0.5,
        damage: Math.round(60 * missionMul),
        points: 150,
        width: 55,
        height: 55,
        fireRate: 3000,
        ai: 'snipe' as const,
      };
    case "boss":
      return {
        health: Math.round(800 * missionMul),
        speed: 0.6,
        damage: Math.round(50 * missionMul),
        points: 1000,
        width: 80,
        height: 80,
        fireRate: 1000,
        ai: 'aggressive' as const,
      };
    default:
      return {
        health: 50,
        speed: 1.5,
        damage: 10,
        points: 50,
        width: 40,
        height: 40,
        fireRate: 2000,
        ai: 'patrol' as const,
      };
  }
};
