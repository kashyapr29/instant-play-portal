import { Court } from './types';
export const COURTS: Court[] = [
  { id: 1, name: 'Backyard Court', type: 'outdoor', unlockLevel: 0, bgColors: ['#48BB78', '#38A169'], courtColor: '#276749', lineColor: '#FFFFFF', description: 'Start your pickleball journey.' },
  { id: 2, name: 'Community Center', type: 'indoor', unlockLevel: 3, bgColors: ['#4299E1', '#3182CE'], courtColor: '#2B6CB0', lineColor: '#FFFFFF', description: 'Local club venue.' },
  { id: 3, name: 'Sports Complex', type: 'indoor', unlockLevel: 5, bgColors: ['#9F7AEA', '#805AD5'], courtColor: '#553C9A', lineColor: '#FFFFFF', description: 'Regional tournament center.' },
  { id: 4, name: 'City Stadium', type: 'tournament', unlockLevel: 7, bgColors: ['#ED8936', '#DD6B20'], courtColor: '#C05621', lineColor: '#FFFFFF', description: 'Championship venue.' },
  { id: 5, name: 'Night Arena', type: 'tournament', unlockLevel: 10, bgColors: ['#1A202C', '#2D3748'], courtColor: '#1A365D', lineColor: '#63B3ED', description: 'Prime time action!' },
  { id: 6, name: 'Beach Court', type: 'outdoor', unlockLevel: 12, bgColors: ['#ECC94B', '#D69E2E'], courtColor: '#B7791F', lineColor: '#FFFFF0', description: 'Sunset beach vibes.' },
  { id: 7, name: 'Pro League', type: 'championship', unlockLevel: 15, bgColors: ['#2D3748', '#1A202C'], courtColor: '#2C5282', lineColor: '#FBD38D', description: 'Professional league.' },
  { id: 8, name: 'World Finals', type: 'championship', unlockLevel: 18, bgColors: ['#0F0C29', '#302B63'], courtColor: '#1A1A3E', lineColor: '#FFD700', description: 'The ultimate stage!' },
];
export const getCourtById = (id: number): Court => COURTS.find(c => c.id === id) || COURTS[0];
export const getUnlockedCourts = (level: number): Court[] => COURTS.filter(c => c.unlockLevel <= level);
export const getAIDifficulty = (courtId: number) => {
  const difficulties = [
    { reactionTime: 1500, accuracy: 0.15, aggression: 0.10, ballSpeed: 3, hitWindow: 500 },
    { reactionTime: 1200, accuracy: 0.22, aggression: 0.15, ballSpeed: 3.5, hitWindow: 420 },
    { reactionTime: 1000, accuracy: 0.30, aggression: 0.20, ballSpeed: 4, hitWindow: 350 },
    { reactionTime: 750, accuracy: 0.42, aggression: 0.30, ballSpeed: 5, hitWindow: 300 },
    { reactionTime: 550, accuracy: 0.55, aggression: 0.40, ballSpeed: 6, hitWindow: 250 },
    { reactionTime: 400, accuracy: 0.68, aggression: 0.50, ballSpeed: 7, hitWindow: 200 },
    { reactionTime: 280, accuracy: 0.80, aggression: 0.60, ballSpeed: 8, hitWindow: 150 },
    { reactionTime: 150, accuracy: 0.90, aggression: 0.75, ballSpeed: 9, hitWindow: 120 },
  ];
  return difficulties[Math.min(courtId - 1, difficulties.length - 1)];
};
