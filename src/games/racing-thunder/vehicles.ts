// Racing Thunder - Vehicles Module

import { Vehicle } from './types';

export const VEHICLES: Vehicle[] = [
  // Starter Vehicles
  {
    id: 'starter-car',
    name: 'Street Runner',
    type: 'car',
    baseStats: { speed: 5, acceleration: 5, handling: 5, nitro: 5, durability: 5 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 0,
    unlocked: true,
    color: '#ef4444',
    accentColor: '#fbbf24',
    description: 'A balanced starter car perfect for learning the tracks.',
  },
  {
    id: 'starter-bike',
    name: 'Urban Sprint',
    type: 'bike',
    baseStats: { speed: 6, acceleration: 6, handling: 6, nitro: 4, durability: 3 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 300,
    unlocked: false,
    color: '#3b82f6',
    accentColor: '#60a5fa',
    description: 'Fast and agile, but less forgiving on collisions.',
  },
  
  // Sports Class
  {
    id: 'sports-coupe',
    name: 'Velocity GT',
    type: 'car',
    baseStats: { speed: 7, acceleration: 6, handling: 6, nitro: 6, durability: 5 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 1500,
    unlocked: false,
    color: '#8b5cf6',
    accentColor: '#a78bfa',
    description: 'A sleek sports coupe with impressive top speed.',
  },
  {
    id: 'sport-bike',
    name: 'Thunder Bolt',
    type: 'bike',
    baseStats: { speed: 8, acceleration: 7, handling: 5, nitro: 5, durability: 2 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 2000,
    unlocked: false,
    color: '#f59e0b',
    accentColor: '#fcd34d',
    description: 'Lightning fast sport bike for experienced riders.',
  },
  
  // Muscle Class
  {
    id: 'muscle-car',
    name: 'Titan Fury',
    type: 'car',
    baseStats: { speed: 8, acceleration: 5, handling: 4, nitro: 8, durability: 7 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 3000,
    unlocked: false,
    color: '#1e293b',
    accentColor: '#ef4444',
    description: 'Raw power meets devastating nitro capability.',
  },
  {
    id: 'chopper',
    name: 'Road King',
    type: 'bike',
    baseStats: { speed: 6, acceleration: 4, handling: 7, nitro: 7, durability: 5 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 2500,
    unlocked: false,
    color: '#0f172a',
    accentColor: '#c084fc',
    description: 'Classic chopper with great nitro reserves.',
  },
  
  // Super Class
  {
    id: 'supercar',
    name: 'Phantom X',
    type: 'car',
    baseStats: { speed: 9, acceleration: 8, handling: 7, nitro: 7, durability: 4 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 5000,
    unlocked: false,
    color: '#06b6d4',
    accentColor: '#22d3ee',
    description: 'Cutting-edge supercar with exceptional performance.',
  },
  {
    id: 'superbike',
    name: 'Vortex 1000',
    type: 'bike',
    baseStats: { speed: 10, acceleration: 9, handling: 6, nitro: 6, durability: 2 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 6000,
    unlocked: false,
    color: '#10b981',
    accentColor: '#34d399',
    description: 'The fastest bike on two wheels. Handle with care.',
  },
  
  // Hyper Class
  {
    id: 'hypercar',
    name: 'Inferno RS',
    type: 'car',
    baseStats: { speed: 10, acceleration: 9, handling: 8, nitro: 9, durability: 5 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 10000,
    unlocked: false,
    color: '#dc2626',
    accentColor: '#fbbf24',
    description: 'The ultimate hypercar. Dominates every track.',
  },
  {
    id: 'hyperbike',
    name: 'Neon Phantom',
    type: 'bike',
    baseStats: { speed: 10, acceleration: 10, handling: 8, nitro: 8, durability: 3 },
    upgradeLevels: { speed: 0, acceleration: 0, handling: 0, nitro: 0, durability: 0 },
    unlockCost: 12000,
    unlocked: false,
    color: '#ec4899',
    accentColor: '#f472b6',
    description: 'Futuristic hyperbike with unmatched acceleration.',
  },
];

export function getVehicleById(id: string): Vehicle | undefined {
  return VEHICLES.find(v => v.id === id);
}

export function getUpgradeCost(currentLevel: number): number {
  const baseCosts = [100, 250, 500, 1000, 2000];
  return baseCosts[currentLevel] || 9999;
}

export function getVehicleWithUpgrades(vehicle: Vehicle, upgrades?: Record<string, any>): Vehicle {
  if (!upgrades || !upgrades[vehicle.id]) return vehicle;
  
  const vehicleUpgrades = upgrades[vehicle.id];
  return {
    ...vehicle,
    baseStats: {
      speed: Math.min(10, vehicle.baseStats.speed + vehicleUpgrades.speed * 0.5),
      acceleration: Math.min(10, vehicle.baseStats.acceleration + vehicleUpgrades.acceleration * 0.5),
      handling: Math.min(10, vehicle.baseStats.handling + vehicleUpgrades.handling * 0.5),
      nitro: Math.min(10, vehicle.baseStats.nitro + vehicleUpgrades.nitro * 0.5),
      durability: Math.min(10, vehicle.baseStats.durability + vehicleUpgrades.durability * 0.5),
    },
    upgradeLevels: vehicleUpgrades,
  };
}
