// Racing Thunder - Tracks Module

import { Track, Challenge } from './types';

export const TRACKS: Track[] = [
  {
    id: 'city-streets',
    name: 'City Streets',
    description: 'Navigate through busy downtown traffic. Perfect for beginners.',
    difficulty: 1,
    laps: 3,
    length: 1000,
    environment: 'city',
    unlockCost: 0,
    unlocked: true,
    bestTime: null,
    curves: [
      { position: 200, direction: 'right', intensity: 2 },
      { position: 500, direction: 'left', intensity: 2 },
      { position: 800, direction: 'right', intensity: 3 },
    ],
    obstacles: [],
    powerUpSpawns: [
      { x: 0, z: 150 }, { x: 2, z: 400 }, { x: -2, z: 700 },
    ],
  },
  {
    id: 'sunset-highway',
    name: 'Sunset Highway',
    description: 'Race along the coastal highway as the sun sets.',
    difficulty: 2,
    laps: 3,
    length: 1200,
    environment: 'beach',
    unlockCost: 500,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 300, direction: 'left', intensity: 3 },
      { position: 600, direction: 'right', intensity: 2 },
      { position: 900, direction: 'left', intensity: 4 },
    ],
    obstacles: [
      { type: 'cone', x: -1, z: 400, width: 0.5 },
      { type: 'cone', x: 1, z: 800, width: 0.5 },
    ],
    powerUpSpawns: [
      { x: -1, z: 200 }, { x: 1, z: 500 }, { x: 0, z: 900 },
    ],
  },
  {
    id: 'desert-dash',
    name: 'Desert Dash',
    description: 'Blaze through endless sand dunes and rocky terrain.',
    difficulty: 2,
    laps: 3,
    length: 1500,
    environment: 'desert',
    unlockCost: 800,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 400, direction: 'right', intensity: 4 },
      { position: 800, direction: 'left', intensity: 3 },
      { position: 1200, direction: 'right', intensity: 3 },
    ],
    obstacles: [
      { type: 'rock', x: 2, z: 300, width: 1 },
      { type: 'rock', x: -2, z: 700, width: 1 },
      { type: 'oil', x: 0, z: 1000, width: 2 },
    ],
    powerUpSpawns: [
      { x: 0, z: 250 }, { x: -2, z: 600 }, { x: 2, z: 1100 },
    ],
  },
  {
    id: 'mountain-pass',
    name: 'Mountain Pass',
    description: 'Treacherous mountain roads with sharp turns and steep drops.',
    difficulty: 3,
    laps: 3,
    length: 1400,
    environment: 'mountain',
    unlockCost: 1200,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 200, direction: 'left', intensity: 4 },
      { position: 500, direction: 'right', intensity: 5 },
      { position: 800, direction: 'left', intensity: 4 },
      { position: 1100, direction: 'right', intensity: 3 },
    ],
    obstacles: [
      { type: 'rock', x: -1, z: 350, width: 0.8 },
      { type: 'barrier', x: 2, z: 650, width: 0.5 },
      { type: 'rock', x: 1, z: 950, width: 0.8 },
    ],
    powerUpSpawns: [
      { x: 1, z: 300 }, { x: -1, z: 700 }, { x: 0, z: 1200 },
    ],
  },
  {
    id: 'neon-nights',
    name: 'Neon Nights',
    description: 'Downtown at midnight. Neon lights and tight corners.',
    difficulty: 3,
    laps: 4,
    length: 1100,
    environment: 'night',
    unlockCost: 1500,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 200, direction: 'right', intensity: 4 },
      { position: 400, direction: 'left', intensity: 5 },
      { position: 600, direction: 'right', intensity: 4 },
      { position: 850, direction: 'left', intensity: 3 },
    ],
    obstacles: [
      { type: 'barrier', x: -2, z: 300, width: 0.5 },
      { type: 'oil', x: 0, z: 550, width: 1.5 },
      { type: 'cone', x: 2, z: 750, width: 0.5 },
    ],
    powerUpSpawns: [
      { x: -2, z: 200 }, { x: 2, z: 500 }, { x: 0, z: 900 },
    ],
  },
  {
    id: 'frozen-fury',
    name: 'Frozen Fury',
    description: 'Icy roads and blizzard conditions. Grip is everything.',
    difficulty: 4,
    laps: 3,
    length: 1600,
    environment: 'snow',
    unlockCost: 2000,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 300, direction: 'left', intensity: 3 },
      { position: 600, direction: 'right', intensity: 4 },
      { position: 1000, direction: 'left', intensity: 5 },
      { position: 1400, direction: 'right', intensity: 4 },
    ],
    obstacles: [
      { type: 'oil', x: -1, z: 450, width: 2 }, // Ice patch
      { type: 'rock', x: 2, z: 800, width: 1 },
      { type: 'oil', x: 1, z: 1200, width: 2 },
    ],
    powerUpSpawns: [
      { x: 0, z: 350 }, { x: -2, z: 750 }, { x: 2, z: 1300 },
    ],
  },
  {
    id: 'thunder-circuit',
    name: 'Thunder Circuit',
    description: 'Professional racing circuit with demanding curves.',
    difficulty: 4,
    laps: 5,
    length: 1300,
    environment: 'city',
    unlockCost: 2500,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 200, direction: 'right', intensity: 5 },
      { position: 400, direction: 'left', intensity: 4 },
      { position: 650, direction: 'right', intensity: 5 },
      { position: 900, direction: 'left', intensity: 5 },
      { position: 1100, direction: 'right', intensity: 3 },
    ],
    obstacles: [
      { type: 'cone', x: -2, z: 300, width: 0.5 },
      { type: 'barrier', x: 2, z: 550, width: 0.5 },
      { type: 'oil', x: 0, z: 800, width: 1.5 },
    ],
    powerUpSpawns: [
      { x: 1, z: 250 }, { x: -1, z: 600 }, { x: 0, z: 1000 },
    ],
  },
  {
    id: 'inferno-run',
    name: 'Inferno Run',
    description: 'The ultimate test. Volcanic terrain and extreme hazards.',
    difficulty: 5,
    laps: 4,
    length: 1800,
    environment: 'desert',
    unlockCost: 4000,
    unlocked: false,
    bestTime: null,
    curves: [
      { position: 300, direction: 'left', intensity: 5 },
      { position: 600, direction: 'right', intensity: 5 },
      { position: 900, direction: 'left', intensity: 4 },
      { position: 1200, direction: 'right', intensity: 5 },
      { position: 1500, direction: 'left', intensity: 5 },
    ],
    obstacles: [
      { type: 'rock', x: -1, z: 400, width: 1 },
      { type: 'barrier', x: 2, z: 750, width: 0.6 },
      { type: 'oil', x: 0, z: 1050, width: 2 },
      { type: 'rock', x: 1, z: 1400, width: 1.2 },
    ],
    powerUpSpawns: [
      { x: -2, z: 300 }, { x: 2, z: 700 }, { x: 0, z: 1100 }, { x: -1, z: 1600 },
    ],
  },
];

export const CHALLENGES: Challenge[] = [
  // Speed Challenges
  { id: 'speed-demon-1', name: 'Speed Demon I', description: 'Reach 150 km/h', type: 'nitro', target: 150, current: 0, completed: false, reward: 200 },
  { id: 'speed-demon-2', name: 'Speed Demon II', description: 'Reach 200 km/h', type: 'nitro', target: 200, current: 0, completed: false, reward: 500 },
  { id: 'speed-demon-3', name: 'Speed Demon III', description: 'Reach 250 km/h', type: 'nitro', target: 250, current: 0, completed: false, reward: 1000 },
  
  // Race Challenges
  { id: 'first-win', name: 'First Victory', description: 'Win your first race', type: 'overtake', target: 1, current: 0, completed: false, reward: 300 },
  { id: 'veteran-racer', name: 'Veteran Racer', description: 'Win 10 races', type: 'overtake', target: 10, current: 0, completed: false, reward: 1000 },
  { id: 'champion', name: 'Racing Champion', description: 'Win 50 races', type: 'overtake', target: 50, current: 0, completed: false, reward: 5000 },
  
  // Perfect Race Challenges
  { id: 'perfect-run-1', name: 'Clean Racer', description: 'Complete a race without damage', type: 'no_damage', target: 1, current: 0, completed: false, reward: 400 },
  { id: 'perfect-run-5', name: 'Flawless Driver', description: 'Complete 5 races without damage', type: 'no_damage', target: 5, current: 0, completed: false, reward: 1500 },
  
  // Collection Challenges
  { id: 'coin-hunter-1', name: 'Coin Hunter I', description: 'Collect 500 coins total', type: 'collect', target: 500, current: 0, completed: false, reward: 250 },
  { id: 'coin-hunter-2', name: 'Coin Hunter II', description: 'Collect 2000 coins total', type: 'collect', target: 2000, current: 0, completed: false, reward: 750 },
  { id: 'coin-hunter-3', name: 'Coin Hunter III', description: 'Collect 10000 coins total', type: 'collect', target: 10000, current: 0, completed: false, reward: 3000 },
  
  // Nitro Challenges
  { id: 'nitro-addict-1', name: 'Nitro Addict I', description: 'Use nitro 50 times', type: 'nitro', target: 50, current: 0, completed: false, reward: 300 },
  { id: 'nitro-addict-2', name: 'Nitro Addict II', description: 'Use nitro 200 times', type: 'nitro', target: 200, current: 0, completed: false, reward: 1000 },
  
  // Drift Challenges
  { id: 'drift-king-1', name: 'Drift Apprentice', description: 'Drift for 10 seconds total', type: 'drift', target: 10, current: 0, completed: false, reward: 350 },
  { id: 'drift-king-2', name: 'Drift Master', description: 'Drift for 60 seconds total', type: 'drift', target: 60, current: 0, completed: false, reward: 1200 },
  
  // Time Challenges
  { id: 'time-attack-1', name: 'Quick Finisher', description: 'Complete City Streets in under 90 seconds', type: 'time', target: 90, current: 0, completed: false, reward: 500 },
  { id: 'time-attack-2', name: 'Speed Record', description: 'Complete Neon Nights in under 120 seconds', type: 'time', target: 120, current: 0, completed: false, reward: 800 },
];

export function getTrackById(id: string): Track | undefined {
  return TRACKS.find(t => t.id === id);
}

export function getChallengeById(id: string): Challenge | undefined {
  return CHALLENGES.find(c => c.id === id);
}

export function getEnvironmentColors(env: Track['environment']): { 
  sky: string; 
  ground: string; 
  road: string; 
  stripe: string;
  accent: string;
} {
  switch (env) {
    case 'city':
      return { sky: '#1a1a2e', ground: '#2d2d2d', road: '#3d3d3d', stripe: '#fbbf24', accent: '#3b82f6' };
    case 'desert':
      return { sky: '#f97316', ground: '#c2410c', road: '#78350f', stripe: '#fef3c7', accent: '#ef4444' };
    case 'mountain':
      return { sky: '#0ea5e9', ground: '#166534', road: '#4b5563', stripe: '#fef9c3', accent: '#22c55e' };
    case 'night':
      return { sky: '#0f0f1a', ground: '#1a1a2e', road: '#2d2d4d', stripe: '#06b6d4', accent: '#f472b6' };
    case 'beach':
      return { sky: '#fb923c', ground: '#fcd34d', road: '#78716c', stripe: '#fff7ed', accent: '#06b6d4' };
    case 'snow':
      return { sky: '#94a3b8', ground: '#f1f5f9', road: '#64748b', stripe: '#1e293b', accent: '#3b82f6' };
    default:
      return { sky: '#1a1a2e', ground: '#2d2d2d', road: '#3d3d3d', stripe: '#fbbf24', accent: '#3b82f6' };
  }
}
