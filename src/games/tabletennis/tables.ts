// Table Tennis Tables / Venues

import { Table } from './types';

export const TABLES: Table[] = [
  {
    id: 1,
    name: 'Basement Table',
    type: 'practice',
    unlockLevel: 0,
    bgColors: ['#4A5568', '#2D3748'],
    tableColor: '#1E40AF',
    lineColor: '#FFFFFF',
    description: 'Start your journey here.',
  },
  {
    id: 2,
    name: 'Local Club',
    type: 'club',
    unlockLevel: 3,
    bgColors: ['#374151', '#1F2937'],
    tableColor: '#1D4ED8',
    lineColor: '#FFFFFF',
    description: 'Join the local club scene.',
  },
  {
    id: 3,
    name: 'City Arena',
    type: 'tournament',
    unlockLevel: 5,
    bgColors: ['#312E81', '#1E1B4B'],
    tableColor: '#2563EB',
    lineColor: '#FFFFFF',
    description: 'City championship venue.',
  },
  {
    id: 4,
    name: 'Sports Center',
    type: 'tournament',
    unlockLevel: 7,
    bgColors: ['#064E3B', '#022C22'],
    tableColor: '#166534',
    lineColor: '#FFFFFF',
    description: 'Regional tournament center.',
  },
  {
    id: 5,
    name: 'Night Stadium',
    type: 'tournament',
    unlockLevel: 10,
    bgColors: ['#0F172A', '#020617'],
    tableColor: '#1E3A8A',
    lineColor: '#60A5FA',
    description: 'Prime time under the lights!',
  },
  {
    id: 6,
    name: 'Grand Hall',
    type: 'tournament',
    unlockLevel: 12,
    bgColors: ['#7C2D12', '#431407'],
    tableColor: '#15803D',
    lineColor: '#F0FDF4',
    description: 'Prestigious national venue.',
  },
  {
    id: 7,
    name: 'World Cup Arena',
    type: 'olympic',
    unlockLevel: 15,
    bgColors: ['#1E1B4B', '#0C0A1E'],
    tableColor: '#1E40AF',
    lineColor: '#FCD34D',
    description: 'World cup championship.',
  },
  {
    id: 8,
    name: 'Olympic Stadium',
    type: 'olympic',
    unlockLevel: 18,
    bgColors: ['#0C0A1E', '#000000'],
    tableColor: '#0F172A',
    lineColor: '#FFD700',
    description: 'The ultimate stage. Olympic glory!',
  },
];

export const getTableById = (id: number): Table => {
  return TABLES.find(t => t.id === id) || TABLES[0];
};

export const getUnlockedTables = (level: number): Table[] => {
  return TABLES.filter(t => t.unlockLevel <= level);
};

export const getAIDifficulty = (tableId: number): { 
  reactionTime: number; 
  accuracy: number; 
  aggression: number;
  ballSpeed: number;
  hitWindow: number;
} => {
  const difficulties = [
    { reactionTime: 1500, accuracy: 0.15, aggression: 0.10, ballSpeed: 4, hitWindow: 500 },
    { reactionTime: 1200, accuracy: 0.22, aggression: 0.15, ballSpeed: 5, hitWindow: 420 },
    { reactionTime: 1000, accuracy: 0.30, aggression: 0.20, ballSpeed: 6, hitWindow: 350 },
    { reactionTime: 750, accuracy: 0.42, aggression: 0.30, ballSpeed: 7, hitWindow: 300 },
    { reactionTime: 550, accuracy: 0.55, aggression: 0.40, ballSpeed: 8, hitWindow: 250 },
    { reactionTime: 400, accuracy: 0.68, aggression: 0.50, ballSpeed: 9, hitWindow: 200 },
    { reactionTime: 280, accuracy: 0.80, aggression: 0.60, ballSpeed: 10, hitWindow: 150 },
    { reactionTime: 150, accuracy: 0.90, aggression: 0.75, ballSpeed: 11, hitWindow: 120 },
  ];
  
  return difficulties[Math.min(tableId - 1, difficulties.length - 1)];
};
