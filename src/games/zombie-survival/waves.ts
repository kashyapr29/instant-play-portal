import { Zombie } from "./types";

export interface WaveConfig {
  id: number;
  name: string;
  zombieCount: number;
  spawnRate: number;
  zombieTypes: Zombie["type"][];
  bossWave?: boolean;
  background: string;
}

export const WAVES: WaveConfig[] = [
  // Night 1: The Beginning
  {
    id: 1,
    name: "First Contact",
    zombieCount: 15,
    spawnRate: 2000,
    zombieTypes: ["walker"],
    background: "suburb",
  },
  {
    id: 2,
    name: "Growing Horde",
    zombieCount: 25,
    spawnRate: 1800,
    zombieTypes: ["walker", "walker", "runner"],
    background: "suburb",
  },
  {
    id: 3,
    name: "Night Falls",
    zombieCount: 35,
    spawnRate: 1600,
    zombieTypes: ["walker", "runner"],
    background: "suburb",
  },
  {
    id: 4,
    name: "The Swarm",
    zombieCount: 45,
    spawnRate: 1400,
    zombieTypes: ["walker", "runner", "spitter"],
    background: "suburb",
  },
  {
    id: 5,
    name: "Suburban Terror",
    zombieCount: 30,
    spawnRate: 2000,
    zombieTypes: ["tank"],
    bossWave: true,
    background: "suburb",
  },
  // Night 2: Urban Nightmare
  {
    id: 6,
    name: "City Streets",
    zombieCount: 50,
    spawnRate: 1500,
    zombieTypes: ["walker", "runner"],
    background: "city",
  },
  {
    id: 7,
    name: "Toxic Threat",
    zombieCount: 55,
    spawnRate: 1400,
    zombieTypes: ["walker", "spitter", "runner"],
    background: "city",
  },
  {
    id: 8,
    name: "Downtown Chaos",
    zombieCount: 60,
    spawnRate: 1300,
    zombieTypes: ["runner", "spitter", "tank"],
    background: "city",
  },
  {
    id: 9,
    name: "Explosive Night",
    zombieCount: 70,
    spawnRate: 1200,
    zombieTypes: ["walker", "runner", "exploder"],
    background: "city",
  },
  {
    id: 10,
    name: "City Boss",
    zombieCount: 40,
    spawnRate: 1800,
    zombieTypes: ["tank", "spitter"],
    bossWave: true,
    background: "city",
  },
  // Night 3: Military Zone
  {
    id: 11,
    name: "Military Compound",
    zombieCount: 80,
    spawnRate: 1100,
    zombieTypes: ["runner", "tank"],
    background: "military",
  },
  {
    id: 12,
    name: "Quarantine Zone",
    zombieCount: 90,
    spawnRate: 1000,
    zombieTypes: ["spitter", "exploder", "tank"],
    background: "military",
  },
  {
    id: 13,
    name: "Ground Zero",
    zombieCount: 100,
    spawnRate: 900,
    zombieTypes: ["runner", "spitter", "exploder"],
    background: "military",
  },
  {
    id: 14,
    name: "Last Stand",
    zombieCount: 120,
    spawnRate: 800,
    zombieTypes: ["walker", "runner", "spitter", "exploder", "tank"],
    background: "military",
  },
  {
    id: 15,
    name: "Patient Zero",
    zombieCount: 50,
    spawnRate: 1500,
    zombieTypes: ["boss"],
    bossWave: true,
    background: "military",
  },
];

export const getZombieStats = (type: Zombie["type"], wave: number) => {
  const waveMul = 1 + (wave - 1) * 0.15;
  
  switch (type) {
    case "walker":
      return {
        health: Math.round(30 * waveMul),
        speed: 0.8 + wave * 0.02,
        damage: Math.round(10 * waveMul),
        points: 10,
        width: 35,
        height: 35,
      };
    case "runner":
      return {
        health: Math.round(20 * waveMul),
        speed: 2.5 + wave * 0.05,
        damage: Math.round(8 * waveMul),
        points: 25,
        width: 30,
        height: 30,
      };
    case "tank":
      return {
        health: Math.round(200 * waveMul),
        speed: 0.5 + wave * 0.01,
        damage: Math.round(30 * waveMul),
        points: 100,
        width: 55,
        height: 55,
      };
    case "spitter":
      return {
        health: Math.round(40 * waveMul),
        speed: 1.0 + wave * 0.02,
        damage: Math.round(15 * waveMul),
        points: 50,
        width: 35,
        height: 35,
      };
    case "exploder":
      return {
        health: Math.round(25 * waveMul),
        speed: 1.5 + wave * 0.03,
        damage: Math.round(50 * waveMul),
        points: 40,
        width: 40,
        height: 40,
      };
    case "boss":
      return {
        health: Math.round(1000 * waveMul),
        speed: 0.8,
        damage: Math.round(40 * waveMul),
        points: 500,
        width: 80,
        height: 80,
      };
    default:
      return {
        health: 30,
        speed: 1,
        damage: 10,
        points: 10,
        width: 35,
        height: 35,
      };
  }
};
