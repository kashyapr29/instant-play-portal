import { Level } from './types';

// Brick types:
// 0 = empty
// 1 = normal (1 hit)
// 2 = strong (2 hits)
// 3 = super strong (3 hits)
// 4 = unbreakable
// 5 = explosive
// 6 = powerup brick

// Themes change every 5 levels:
// Levels 1-5: NEON
// Levels 6-10: METAL
// Levels 11-15: CRYSTAL
// Levels 16-20: LAVA
// Levels 21-25: CYBER
// Levels 26-30: COSMIC

export const LEVELS: Level[] = [
  // NEON (1-5)
  {
    id: 1,
    name: 'Neon Ripples',
    description: 'Waves of neon ripples.',
    ballSpeed: 4,
    theme: 'neon',
    layout: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [1, 0, 6, 0, 0, 6, 0, 1],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
    ],
  },
  {
    id: 2,
    name: 'Neon Zigzag',
    description: 'Sharp zigzag paths.',
    ballSpeed: 4.5,
    theme: 'neon',
    layout: [
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 6, 0, 0, 6, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
    ],
  },
  {
    id: 3,
    name: 'Neon Stairs',
    description: 'A staircase of bricks.',
    ballSpeed: 5,
    theme: 'neon',
    layout: [
      [0, 0, 0, 3, 3, 0, 0, 0],
      [0, 0, 2, 1, 1, 2, 0, 0],
      [0, 2, 1, 6, 6, 1, 2, 0],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ],
  },
  {
    id: 4,
    name: 'Neon Hollow',
    description: 'A hollow rectangle with treasures.',
    ballSpeed: 5,
    theme: 'neon',
    layout: [
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 6, 0, 0, 6, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 2],
      [2, 2, 2, 5, 5, 2, 2, 2],
    ],
  },
  {
    id: 5,
    name: 'Neon Cross',
    description: 'Cross-shaped challenge.',
    ballSpeed: 5.5,
    theme: 'neon',
    layout: [
      [0, 1, 0, 0, 0, 0, 1, 0],
      [1, 1, 1, 0, 0, 1, 1, 1],
      [0, 1, 0, 6, 6, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0, 0, 1, 0],
    ],
  },

  // METAL (6-10)
  {
    id: 6,
    name: 'Steel Pillars',
    description: 'Columns of steel.',
    ballSpeed: 5.5,
    theme: 'metal',
    layout: [
      [1, 0, 1, 0, 1, 0, 1, 0],
      [1, 0, 2, 0, 2, 0, 1, 0],
      [1, 0, 6, 0, 6, 0, 1, 0],
      [1, 0, 2, 0, 2, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 0, 0, 4, 4, 0, 0, 0],
    ],
  },
  {
    id: 7,
    name: 'Rusty Spiral',
    description: 'A spiral of metal bricks.',
    ballSpeed: 6,
    theme: 'metal',
    layout: [
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 1],
      [2, 0, 6, 5, 5, 6, 0, 1],
      [2, 0, 0, 0, 0, 0, 0, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
    ],
  },
  {
    id: 8,
    name: 'Gear Maze',
    description: 'Interlocking gears and gaps.',
    ballSpeed: 6,
    theme: 'metal',
    layout: [
      [4, 1, 4, 1, 4, 1, 4, 1],
      [1, 4, 1, 4, 1, 4, 1, 4],
      [4, 1, 6, 1, 1, 6, 1, 4],
      [1, 4, 1, 4, 1, 4, 1, 4],
      [4, 1, 4, 1, 4, 1, 4, 1],
    ],
  },
  {
    id: 9,
    name: 'Hammer Rows',
    description: 'Rows of strong blocks.',
    ballSpeed: 6.5,
    theme: 'metal',
    layout: [
      [3, 3, 3, 3, 3, 3, 3, 3],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [1, 6, 1, 1, 1, 1, 6, 1],
      [0, 0, 2, 5, 5, 2, 0, 0],
      [3, 3, 3, 3, 3, 3, 3, 3],
    ],
  },
  {
    id: 10,
    name: 'Forge Core',
    description: 'Core with powerups.',
    ballSpeed: 7,
    theme: 'metal',
    layout: [
      [4, 2, 2, 2, 2, 2, 2, 4],
      [2, 4, 0, 0, 0, 0, 4, 2],
      [2, 0, 6, 5, 5, 6, 0, 2],
      [2, 4, 0, 0, 0, 0, 4, 2],
      [4, 2, 2, 2, 2, 2, 2, 4],
      [0, 0, 0, 3, 3, 0, 0, 0],
    ],
  },

  // CRYSTAL (11-15)
  {
    id: 11,
    name: 'Frozen Waves',
    description: 'Soft crystalline waves.',
    ballSpeed: 7,
    theme: 'crystal',
    layout: [
      [0, 1, 1, 2, 2, 1, 1, 0],
      [1, 0, 2, 1, 1, 2, 0, 1],
      [1, 2, 6, 0, 0, 6, 2, 1],
      [1, 0, 2, 1, 1, 2, 0, 1],
      [0, 1, 1, 2, 2, 1, 1, 0],
    ],
  },
  {
    id: 12,
    name: 'Crystal Spire',
    description: 'Tall spire formations.',
    ballSpeed: 7.5,
    theme: 'crystal',
    layout: [
      [0, 0, 4, 4, 4, 4, 0, 0],
      [0, 2, 1, 1, 1, 1, 2, 0],
      [2, 1, 6, 0, 0, 6, 1, 2],
      [0, 2, 1, 1, 1, 1, 2, 0],
      [0, 0, 3, 3, 3, 3, 0, 0],
    ],
  },
  {
    id: 13,
    name: 'Diamond Field',
    description: 'A diamond cluster at center.',
    ballSpeed: 7.5,
    theme: 'crystal',
    layout: [
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 2, 1, 1, 2, 1, 0],
      [1, 2, 6, 5, 5, 6, 2, 1],
      [0, 1, 2, 1, 1, 2, 1, 0],
      [0, 0, 1, 0, 0, 1, 0, 0],
    ],
  },
  {
    id: 14,
    name: 'Prism Maze',
    description: 'Shifting crystal columns.',
    ballSpeed: 8,
    theme: 'crystal',
    layout: [
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [2, 0, 6, 0, 0, 6, 0, 2],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [2, 0, 2, 0, 2, 0, 2, 0],
    ],
  },
  {
    id: 15,
    name: 'Ice Throne',
    description: 'A throne of unbreakables.',
    ballSpeed: 8,
    theme: 'crystal',
    layout: [
      [4, 4, 3, 3, 3, 3, 4, 4],
      [4, 0, 2, 6, 6, 2, 0, 4],
      [3, 2, 1, 5, 5, 1, 2, 3],
      [3, 0, 2, 1, 1, 2, 0, 3],
      [4, 3, 3, 2, 2, 3, 3, 4],
    ],
  },

  // LAVA (16-20)
  {
    id: 16,
    name: 'Magma Veins',
    description: 'Veins of molten rock.',
    ballSpeed: 8,
    theme: 'lava',
    layout: [
      [0, 3, 0, 3, 0, 3, 0, 3],
      [3, 0, 3, 0, 3, 0, 3, 0],
      [0, 3, 6, 0, 0, 6, 3, 0],
      [3, 0, 3, 0, 3, 0, 3, 0],
      [0, 3, 0, 5, 5, 0, 3, 0],
    ],
  },
  {
    id: 17,
    name: 'Volcano Core',
    description: 'Hot core with strong blocks.',
    ballSpeed: 8.5,
    theme: 'lava',
    layout: [
      [4, 4, 2, 2, 2, 2, 4, 4],
      [4, 2, 1, 1, 1, 1, 2, 4],
      [2, 1, 6, 0, 0, 6, 1, 2],
      [4, 2, 1, 1, 1, 1, 2, 4],
      [4, 4, 3, 5, 5, 3, 4, 4],
    ],
  },
  {
    id: 18,
    name: 'Lava Rings',
    description: 'Rings of molten blocks.',
    ballSpeed: 8.5,
    theme: 'lava',
    layout: [
      [2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 0, 0, 2],
      [2, 0, 6, 5, 5, 6, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 2],
      [2, 2, 2, 3, 3, 2, 2, 2],
    ],
  },
  {
    id: 19,
    name: 'Magma Columns',
    description: 'Tall magma columns.',
    ballSpeed: 9,
    theme: 'lava',
    layout: [
      [1, 4, 1, 4, 1, 4, 1, 4],
      [1, 4, 6, 4, 6, 4, 6, 4],
      [1, 4, 1, 4, 1, 4, 1, 4],
      [0, 0, 0, 5, 5, 0, 0, 0],
      [3, 3, 3, 3, 3, 3, 3, 3],
    ],
  },
  {
    id: 20,
    name: 'Lava Throne',
    description: 'The guardian sits at the center.',
    ballSpeed: 9,
    theme: 'lava',
    layout: [
      [4, 3, 3, 3, 3, 3, 3, 4],
      [3, 4, 2, 6, 6, 2, 4, 3],
      [3, 2, 1, 5, 5, 1, 2, 3],
      [3, 4, 2, 1, 1, 2, 4, 3],
      [4, 3, 3, 2, 2, 3, 3, 4],
      [0, 0, 0, 3, 3, 0, 0, 0],
    ],
  },

  // CYBER (21-25)
  {
    id: 21,
    name: 'Neon Circuit',
    description: 'Circuit-like lanes.',
    ballSpeed: 9,
    theme: 'cyber',
    layout: [
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 6, 0, 0, 6, 0, 1],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 0, 0, 4, 4, 0, 0, 0],
    ],
  },
  {
    id: 22,
    name: 'Data Stream',
    description: 'Flowing vertical streams.',
    ballSpeed: 9.5,
    theme: 'cyber',
    layout: [
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 6, 0, 5, 5, 0, 6, 1],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [3, 3, 3, 3, 3, 3, 3, 3],
    ],
  },
  {
    id: 23,
    name: 'AI Grid',
    description: 'A precise engineered grid.',
    ballSpeed: 9.5,
    theme: 'cyber',
    layout: [
      [2, 2, 1, 1, 1, 1, 2, 2],
      [2, 6, 0, 0, 0, 0, 6, 2],
      [1, 0, 5, 5, 5, 5, 0, 1],
      [2, 6, 0, 0, 0, 0, 6, 2],
      [2, 2, 1, 1, 1, 1, 2, 2],
    ],
  },
  {
    id: 24,
    name: 'Firewall',
    description: 'A defensive firewall pattern.',
    ballSpeed: 10,
    theme: 'cyber',
    layout: [
      [4, 4, 4, 0, 0, 4, 4, 4],
      [4, 0, 6, 0, 0, 6, 0, 4],
      [4, 6, 0, 5, 5, 0, 6, 4],
      [4, 0, 6, 0, 0, 6, 0, 4],
      [4, 4, 4, 3, 3, 4, 4, 4],
    ],
  },
  {
    id: 25,
    name: 'Overclock Core',
    description: 'A dense core to break.',
    ballSpeed: 10,
    theme: 'cyber',
    layout: [
      [3, 3, 2, 2, 2, 2, 3, 3],
      [3, 2, 6, 6, 6, 6, 2, 3],
      [2, 6, 5, 0, 0, 5, 6, 2],
      [3, 2, 6, 6, 6, 6, 2, 3],
      [3, 3, 2, 2, 2, 2, 3, 3],
    ],
  },

  // COSMIC (26-30)
  {
    id: 26,
    name: 'Starfield',
    description: 'Scattered stellar bricks.',
    ballSpeed: 10,
    theme: 'cosmic',
    layout: [
      [0, 0, 1, 0, 0, 1, 0, 0],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [1, 0, 6, 0, 0, 6, 0, 1],
      [0, 2, 0, 2, 0, 2, 0, 2],
      [0, 0, 1, 0, 0, 1, 0, 0],
    ],
  },
  {
    id: 27,
    name: 'Orbit Paths',
    description: 'Orbits and rings of bricks.',
    ballSpeed: 10.5,
    theme: 'cosmic',
    layout: [
      [2, 2, 2, 0, 0, 2, 2, 2],
      [2, 0, 6, 0, 0, 6, 0, 2],
      [2, 6, 0, 5, 5, 0, 6, 2],
      [2, 0, 6, 0, 0, 6, 0, 2],
      [2, 2, 2, 3, 3, 2, 2, 2],
    ],
  },
  {
    id: 28,
    name: 'Rift Lines',
    description: 'Jagged rifts split the field.',
    ballSpeed: 10.5,
    theme: 'cosmic',
    layout: [
      [1, 0, 1, 0, 1, 0, 1, 0],
      [0, 5, 0, 5, 0, 5, 0, 5],
      [1, 0, 6, 0, 0, 6, 0, 1],
      [0, 5, 0, 5, 0, 5, 0, 5],
      [1, 0, 1, 0, 1, 0, 1, 0],
    ],
  },
  {
    id: 29,
    name: 'Nebula Cluster',
    description: 'Dense clusters with powerups.',
    ballSpeed: 11,
    theme: 'cosmic',
    layout: [
      [4, 1, 1, 4, 4, 1, 1, 4],
      [1, 4, 6, 1, 1, 6, 4, 1],
      [1, 6, 5, 0, 0, 5, 6, 1],
      [1, 4, 6, 1, 1, 6, 4, 1],
      [4, 1, 1, 4, 4, 1, 1, 4],
    ],
  },
  {
    id: 30,
    name: 'Galactic Apex',
    description: 'The ultimate cosmic test.',
    ballSpeed: 11,
    theme: 'cosmic',
    layout: [
      [4, 3, 3, 2, 2, 3, 3, 4],
      [3, 4, 2, 6, 6, 2, 4, 3],
      [3, 2, 5, 0, 0, 5, 2, 3],
      [2, 6, 1, 1, 1, 1, 6, 2],
      [3, 3, 2, 2, 2, 2, 3, 3],
      [0, 0, 3, 3, 3, 3, 0, 0],
    ],
  },
];

export const getTotalLevels = () => LEVELS.length;
