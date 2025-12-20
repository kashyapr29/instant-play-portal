import { Level } from './types';

// Brick types:
// 0 = empty
// 1 = normal (1 hit)
// 2 = strong (2 hits)
// 3 = super strong (3 hits)
// 4 = unbreakable
// 5 = explosive
// 6 = powerup brick

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Welcome",
    description: "Break all the bricks to advance!",
    ballSpeed: 4,
    layout: [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 6, 6, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
    ]
  },
  {
    id: 2,
    name: "The Wall",
    description: "A solid wall of bricks awaits!",
    ballSpeed: 4.5,
    layout: [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [1, 1, 1, 6, 6, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  {
    id: 3,
    name: "Pyramid",
    description: "Climb the ancient pyramid!",
    ballSpeed: 5,
    layout: [
      [0, 0, 0, 2, 2, 0, 0, 0],
      [0, 0, 2, 1, 1, 2, 0, 0],
      [0, 2, 1, 6, 6, 1, 2, 0],
      [2, 1, 1, 1, 1, 1, 1, 2],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  {
    id: 4,
    name: "Fortress",
    description: "Breach the fortress walls!",
    ballSpeed: 5,
    layout: [
      [4, 0, 1, 1, 1, 1, 0, 4],
      [4, 0, 2, 2, 2, 2, 0, 4],
      [4, 0, 1, 6, 6, 1, 0, 4],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [1, 1, 1, 5, 5, 1, 1, 1],
    ]
  },
  {
    id: 5,
    name: "Checkerboard",
    description: "A classic pattern with a twist!",
    ballSpeed: 5.5,
    layout: [
      [2, 0, 2, 0, 2, 0, 2, 0],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [2, 0, 6, 0, 0, 6, 0, 2],
      [0, 1, 0, 1, 0, 1, 0, 1],
      [2, 0, 2, 0, 2, 0, 2, 0],
    ]
  },
  {
    id: 6,
    name: "Heart",
    description: "Break the heart!",
    ballSpeed: 5.5,
    layout: [
      [0, 2, 2, 0, 0, 2, 2, 0],
      [2, 1, 1, 2, 2, 1, 1, 2],
      [2, 1, 6, 1, 1, 6, 1, 2],
      [0, 2, 1, 1, 1, 1, 2, 0],
      [0, 0, 2, 1, 1, 2, 0, 0],
      [0, 0, 0, 2, 2, 0, 0, 0],
    ]
  },
  {
    id: 7,
    name: "Chaos",
    description: "Explosive chaos awaits!",
    ballSpeed: 6,
    layout: [
      [1, 5, 1, 1, 1, 1, 5, 1],
      [2, 1, 2, 5, 5, 2, 1, 2],
      [1, 2, 1, 6, 6, 1, 2, 1],
      [5, 1, 2, 1, 1, 2, 1, 5],
      [1, 1, 1, 1, 1, 1, 1, 1],
    ]
  },
  {
    id: 8,
    name: "The Maze",
    description: "Navigate through the maze!",
    ballSpeed: 6,
    layout: [
      [4, 1, 1, 1, 4, 1, 1, 4],
      [1, 4, 1, 4, 1, 4, 1, 1],
      [1, 1, 6, 1, 1, 6, 1, 1],
      [1, 4, 1, 4, 1, 4, 1, 1],
      [4, 1, 1, 1, 4, 1, 1, 4],
    ]
  },
  {
    id: 9,
    name: "Gauntlet",
    description: "Run the gauntlet!",
    ballSpeed: 6.5,
    layout: [
      [3, 3, 3, 3, 3, 3, 3, 3],
      [2, 2, 2, 6, 6, 2, 2, 2],
      [4, 1, 4, 1, 1, 4, 1, 4],
      [2, 2, 2, 5, 5, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3],
    ]
  },
  {
    id: 10,
    name: "Final Boss",
    description: "The ultimate challenge!",
    ballSpeed: 7,
    layout: [
      [4, 3, 3, 3, 3, 3, 3, 4],
      [4, 3, 2, 6, 6, 2, 3, 4],
      [4, 2, 1, 5, 5, 1, 2, 4],
      [3, 2, 1, 1, 1, 1, 2, 3],
      [3, 2, 2, 2, 2, 2, 2, 3],
      [3, 3, 3, 3, 3, 3, 3, 3],
    ]
  },
];

export const getTotalLevels = () => LEVELS.length;
