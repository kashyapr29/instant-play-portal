// Tennis Hero Courts / Levels

import { Court } from './types';

export const COURTS: Court[] = [
  {
    id: 1,
    name: 'Training Court',
    surface: 'hard',
    unlockLevel: 0,
    bgColors: ['#87CEEB', '#98D8C8'],
    courtColor: '#4A90A4',
    lineColor: '#FFFFFF',
    description: 'Perfect for beginners. Master the basics here.',
  },
  {
    id: 2,
    name: 'City Stadium',
    surface: 'hard',
    unlockLevel: 3,
    bgColors: ['#667eea', '#764ba2'],
    courtColor: '#1E5AAF',
    lineColor: '#FFFFFF',
    description: 'Urban arena with passionate crowds.',
  },
  {
    id: 3,
    name: 'Grass Masters',
    surface: 'grass',
    unlockLevel: 5,
    bgColors: ['#56ab2f', '#a8e063'],
    courtColor: '#2E7D32',
    lineColor: '#FFFFFF',
    description: 'Classic grass court. Fast and slick!',
  },
  {
    id: 4,
    name: 'Clay Championship',
    surface: 'clay',
    unlockLevel: 7,
    bgColors: ['#FF8A65', '#FFB74D'],
    courtColor: '#BF5B23',
    lineColor: '#FFFFFF',
    description: 'Red clay demands endurance and strategy.',
  },
  {
    id: 5,
    name: 'Night Arena',
    surface: 'hard',
    unlockLevel: 10,
    bgColors: ['#1a1a2e', '#16213e'],
    courtColor: '#0f3460',
    lineColor: '#e94560',
    description: 'Under the lights. Prime time action!',
  },
  {
    id: 6,
    name: 'Sunset Beach',
    surface: 'hard',
    unlockLevel: 12,
    bgColors: ['#ff7e5f', '#feb47b'],
    courtColor: '#C17650',
    lineColor: '#FFF8DC',
    description: 'Beach vibes with a stunning sunset.',
  },
  {
    id: 7,
    name: 'Royal Indoor',
    surface: 'indoor',
    unlockLevel: 15,
    bgColors: ['#2c3e50', '#34495e'],
    courtColor: '#1a252f',
    lineColor: '#f39c12',
    description: 'Elite indoor court for champions.',
  },
  {
    id: 8,
    name: 'International Finals',
    surface: 'hard',
    unlockLevel: 18,
    bgColors: ['#0f0c29', '#302b63', '#24243e'],
    courtColor: '#1a1a3e',
    lineColor: '#FFD700',
    description: 'The ultimate stage. World championship!',
  },
];

export const getCourtById = (id: number): Court => {
  return COURTS.find(c => c.id === id) || COURTS[0];
};

export const getUnlockedCourts = (level: number): Court[] => {
  return COURTS.filter(c => c.unlockLevel <= level);
};

// AI difficulty scaling per court
export const getAIDifficulty = (courtId: number): { 
  reactionTime: number; 
  accuracy: number; 
  aggression: number;
  ballSpeed: number;
  hitWindow: number;
} => {
  const difficulties = [
    { reactionTime: 600, accuracy: 0.5, aggression: 0.3, ballSpeed: 4, hitWindow: 300 },
    { reactionTime: 500, accuracy: 0.55, aggression: 0.35, ballSpeed: 4.5, hitWindow: 280 },
    { reactionTime: 450, accuracy: 0.6, aggression: 0.4, ballSpeed: 5, hitWindow: 260 },
    { reactionTime: 400, accuracy: 0.65, aggression: 0.45, ballSpeed: 5.5, hitWindow: 240 },
    { reactionTime: 350, accuracy: 0.7, aggression: 0.5, ballSpeed: 6, hitWindow: 220 },
    { reactionTime: 300, accuracy: 0.75, aggression: 0.55, ballSpeed: 6.5, hitWindow: 200 },
    { reactionTime: 250, accuracy: 0.8, aggression: 0.6, ballSpeed: 7, hitWindow: 180 },
    { reactionTime: 200, accuracy: 0.85, aggression: 0.7, ballSpeed: 8, hitWindow: 150 },
  ];
  
  return difficulties[Math.min(courtId - 1, difficulties.length - 1)];
};
