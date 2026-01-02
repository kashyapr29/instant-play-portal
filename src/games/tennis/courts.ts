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
// Initial levels are easier so player can beat the opponent
// Difficulty increases gradually with each court level
export const getAIDifficulty = (courtId: number): { 
  reactionTime: number; 
  accuracy: number; 
  aggression: number;
  ballSpeed: number;
  hitWindow: number;
} => {
  const difficulties = [
    // Level 1: Very easy - AI makes many mistakes, slow movement
    { reactionTime: 1500, accuracy: 0.15, aggression: 0.10, ballSpeed: 2.5, hitWindow: 500 },
    // Level 2: Easy - AI still makes frequent mistakes
    { reactionTime: 1200, accuracy: 0.22, aggression: 0.15, ballSpeed: 3, hitWindow: 420 },
    // Level 3: Medium-easy - AI makes occasional mistakes
    { reactionTime: 1000, accuracy: 0.30, aggression: 0.20, ballSpeed: 3.5, hitWindow: 350 },
    // Level 4: Medium - Balanced gameplay
    { reactionTime: 750, accuracy: 0.42, aggression: 0.30, ballSpeed: 4, hitWindow: 300 },
    // Level 5: Medium-hard - AI is competitive
    { reactionTime: 550, accuracy: 0.55, aggression: 0.40, ballSpeed: 5, hitWindow: 250 },
    // Level 6: Hard - Challenging for most players
    { reactionTime: 400, accuracy: 0.68, aggression: 0.50, ballSpeed: 6, hitWindow: 200 },
    // Level 7: Very hard - Expert level AI
    { reactionTime: 280, accuracy: 0.80, aggression: 0.60, ballSpeed: 7, hitWindow: 150 },
    // Level 8: Expert - Supreme difficulty
    { reactionTime: 150, accuracy: 0.90, aggression: 0.75, ballSpeed: 8, hitWindow: 120 },
  ];
  
  return difficulties[Math.min(courtId - 1, difficulties.length - 1)];
};
