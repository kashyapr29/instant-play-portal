// Badminton Courts / Venues

import { Court } from './types';

export const COURTS: Court[] = [
  {
    id: 1,
    name: 'Practice Hall',
    type: 'indoor',
    unlockLevel: 0,
    bgColors: ['#4A5568', '#2D3748'],
    courtColor: '#2B6CB0',
    lineColor: '#FFFFFF',
    description: 'Perfect for beginners. Learn the basics here.',
  },
  {
    id: 2,
    name: 'Community Center',
    type: 'indoor',
    unlockLevel: 3,
    bgColors: ['#5A67D8', '#4C51BF'],
    courtColor: '#2C5282',
    lineColor: '#FFFFFF',
    description: 'Local community tournament venue.',
  },
  {
    id: 3,
    name: 'Sports Complex',
    type: 'indoor',
    unlockLevel: 5,
    bgColors: ['#38B2AC', '#319795'],
    courtColor: '#234E52',
    lineColor: '#FFFFFF',
    description: 'Professional training facility.',
  },
  {
    id: 4,
    name: 'City Stadium',
    type: 'stadium',
    unlockLevel: 7,
    bgColors: ['#ED8936', '#DD6B20'],
    courtColor: '#7B341E',
    lineColor: '#FFFFFF',
    description: 'Regional championship venue.',
  },
  {
    id: 5,
    name: 'Night Arena',
    type: 'stadium',
    unlockLevel: 10,
    bgColors: ['#1A202C', '#2D3748'],
    courtColor: '#1A365D',
    lineColor: '#63B3ED',
    description: 'Under the spotlights!',
  },
  {
    id: 6,
    name: 'Beach Club',
    type: 'outdoor',
    unlockLevel: 12,
    bgColors: ['#48BB78', '#38A169'],
    courtColor: '#276749',
    lineColor: '#F7FAFC',
    description: 'Outdoor beach badminton experience.',
  },
  {
    id: 7,
    name: 'Elite Academy',
    type: 'indoor',
    unlockLevel: 15,
    bgColors: ['#9F7AEA', '#805AD5'],
    courtColor: '#44337A',
    lineColor: '#FAF5FF',
    description: 'World-class training center.',
  },
  {
    id: 8,
    name: 'Olympic Arena',
    type: 'olympic',
    unlockLevel: 18,
    bgColors: ['#C53030', '#9B2C2C'],
    courtColor: '#742A2A',
    lineColor: '#FED7D7',
    description: 'The ultimate stage. Olympic finals!',
  },
];

export const getCourtById = (id: number): Court => {
  return COURTS.find(c => c.id === id) || COURTS[0];
};

export const getUnlockedCourts = (level: number): Court[] => {
  return COURTS.filter(c => c.unlockLevel <= level);
};

export const getAIDifficulty = (courtId: number): { 
  reactionTime: number; 
  accuracy: number; 
  aggression: number;
  shuttleSpeed: number;
  hitWindow: number;
} => {
  const difficulties = [
    { reactionTime: 1500, accuracy: 0.15, aggression: 0.10, shuttleSpeed: 3, hitWindow: 500 },
    { reactionTime: 1200, accuracy: 0.22, aggression: 0.15, shuttleSpeed: 3.5, hitWindow: 420 },
    { reactionTime: 1000, accuracy: 0.30, aggression: 0.20, shuttleSpeed: 4, hitWindow: 350 },
    { reactionTime: 750, accuracy: 0.42, aggression: 0.30, shuttleSpeed: 5, hitWindow: 300 },
    { reactionTime: 550, accuracy: 0.55, aggression: 0.40, shuttleSpeed: 6, hitWindow: 250 },
    { reactionTime: 400, accuracy: 0.68, aggression: 0.50, shuttleSpeed: 7, hitWindow: 200 },
    { reactionTime: 280, accuracy: 0.80, aggression: 0.60, shuttleSpeed: 8, hitWindow: 150 },
    { reactionTime: 150, accuracy: 0.90, aggression: 0.75, shuttleSpeed: 9, hitWindow: 120 },
  ];
  
  return difficulties[Math.min(courtId - 1, difficulties.length - 1)];
};
