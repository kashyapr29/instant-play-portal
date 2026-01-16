// Galaxy Rider Level Definitions

import { Level, Block } from './types';

const createBlock = (x: number, y: number, width: number, height: number, type: Block['type'] = 'normal'): Block => ({
  x, y, width, height, type
});

// Level 1: Training Grounds
const level1: Level = {
  id: 1,
  name: 'Training Grounds',
  difficulty: 'easy',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  starTimes: [8, 15, 25],
  blocks: [
    // Ground
    createBlock(0, 500, 300, 100, 'normal'),
    createBlock(350, 500, 200, 100, 'normal'),
    createBlock(600, 500, 300, 100, 'normal'),
    createBlock(950, 500, 400, 100, 'normal'),
    // Finish
    createBlock(1300, 450, 50, 50, 'finish'),
  ],
};

// Level 2: First Jump
const level2: Level = {
  id: 2,
  name: 'First Jump',
  difficulty: 'easy',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #2d132c 0%, #801336 50%, #c72c41 100%)',
  starTimes: [10, 18, 30],
  blocks: [
    createBlock(0, 500, 200, 100, 'normal'),
    createBlock(300, 500, 150, 100, 'normal'),
    createBlock(550, 450, 150, 150, 'normal'),
    createBlock(800, 400, 150, 200, 'normal'),
    createBlock(1050, 350, 200, 250, 'normal'),
    // Spikes
    createBlock(450, 485, 50, 15, 'spike'),
    // Finish
    createBlock(1200, 300, 50, 50, 'finish'),
  ],
};

// Level 3: Rubber Bounce
const level3: Level = {
  id: 3,
  name: 'Rubber Bounce',
  difficulty: 'easy',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #1b262c 0%, #0f4c75 50%, #3282b8 100%)',
  starTimes: [12, 20, 35],
  blocks: [
    createBlock(0, 500, 200, 100, 'normal'),
    createBlock(250, 500, 100, 100, 'rubber'),
    createBlock(400, 400, 100, 200, 'normal'),
    createBlock(550, 500, 100, 100, 'rubber'),
    createBlock(700, 300, 150, 300, 'normal'),
    createBlock(900, 400, 100, 100, 'rubber'),
    createBlock(1050, 200, 200, 400, 'normal'),
    createBlock(1200, 150, 50, 50, 'finish'),
  ],
};

// Level 4: Speed Boost
const level4: Level = {
  id: 4,
  name: 'Speed Demon',
  difficulty: 'easy',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 50%, #333333 100%)',
  starTimes: [10, 16, 28],
  blocks: [
    createBlock(0, 500, 200, 100, 'normal'),
    createBlock(200, 500, 100, 100, 'boost'),
    createBlock(300, 500, 400, 100, 'normal'),
    createBlock(700, 500, 100, 100, 'boost'),
    createBlock(800, 500, 300, 100, 'normal'),
    createBlock(1100, 500, 100, 100, 'boost'),
    createBlock(1200, 500, 200, 100, 'normal'),
    createBlock(1350, 450, 50, 50, 'finish'),
  ],
};

// Level 5: Spike Valley
const level5: Level = {
  id: 5,
  name: 'Spike Valley',
  difficulty: 'medium',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #2c061f 0%, #89023e 50%, #ff006e 100%)',
  starTimes: [15, 25, 40],
  blocks: [
    createBlock(0, 500, 150, 100, 'normal'),
    createBlock(200, 485, 50, 15, 'spike'),
    createBlock(200, 500, 100, 100, 'normal'),
    createBlock(350, 500, 100, 100, 'normal'),
    createBlock(350, 485, 50, 15, 'spike'),
    createBlock(500, 500, 150, 100, 'normal'),
    createBlock(700, 485, 80, 15, 'spike'),
    createBlock(700, 500, 150, 100, 'normal'),
    createBlock(900, 450, 150, 150, 'normal'),
    createBlock(1100, 400, 200, 200, 'normal'),
    createBlock(1250, 350, 50, 50, 'finish'),
  ],
};

// Level 6: The Pit
const level6: Level = {
  id: 6,
  name: 'The Pit',
  difficulty: 'medium',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #e94560 100%)',
  starTimes: [18, 28, 45],
  blocks: [
    createBlock(0, 500, 200, 100, 'normal'),
    // Deep pit
    createBlock(300, 580, 200, 20, 'spike'),
    createBlock(200, 500, 100, 200, 'normal'),
    createBlock(500, 500, 100, 200, 'normal'),
    // Continue
    createBlock(600, 500, 200, 100, 'normal'),
    createBlock(900, 580, 150, 20, 'spike'),
    createBlock(800, 500, 100, 200, 'normal'),
    createBlock(1050, 500, 100, 200, 'normal'),
    createBlock(1150, 500, 200, 100, 'normal'),
    createBlock(1300, 450, 50, 50, 'finish'),
  ],
};

// Level 7: Black Hole Zone
const level7: Level = {
  id: 7,
  name: 'Black Hole Zone',
  difficulty: 'medium',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #0d0d0d 0%, #1a0a2e 50%, #3d0066 100%)',
  starTimes: [20, 32, 50],
  blocks: [
    createBlock(0, 500, 200, 100, 'normal'),
    createBlock(350, 400, 80, 80, 'blackhole'),
    createBlock(300, 500, 200, 100, 'normal'),
    createBlock(600, 300, 80, 80, 'blackhole'),
    createBlock(550, 500, 200, 100, 'normal'),
    createBlock(800, 500, 200, 100, 'normal'),
    createBlock(950, 350, 80, 80, 'blackhole'),
    createBlock(1050, 500, 200, 100, 'normal'),
    createBlock(1200, 450, 50, 50, 'finish'),
  ],
};

// Level 8: Gravity Flip
const level8: Level = {
  id: 8,
  name: 'Upside Down',
  difficulty: 'medium',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #1f1f1f 0%, #2d2d44 50%, #44447d 100%)',
  starTimes: [22, 35, 55],
  blocks: [
    // Ground
    createBlock(0, 500, 200, 100, 'normal'),
    createBlock(200, 500, 50, 100, 'gravity_flip'),
    createBlock(250, 500, 200, 100, 'normal'),
    // Ceiling after flip
    createBlock(250, 0, 400, 100, 'normal'),
    createBlock(650, 500, 50, 100, 'gravity_flip'),
    createBlock(700, 500, 300, 100, 'normal'),
    createBlock(950, 450, 50, 50, 'finish'),
  ],
};

// Level 9: Ramp Runner
const level9: Level = {
  id: 9,
  name: 'Ramp Runner',
  difficulty: 'medium',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a3a1a 50%, #2d5a2d 100%)',
  starTimes: [18, 28, 42],
  blocks: [
    createBlock(0, 500, 150, 100, 'normal'),
    createBlock(150, 500, 100, 100, 'ramp'),
    createBlock(300, 400, 150, 200, 'normal'),
    createBlock(450, 400, 100, 100, 'ramp'),
    createBlock(600, 300, 150, 300, 'normal'),
    createBlock(750, 300, 100, 100, 'ramp'),
    createBlock(900, 200, 200, 400, 'normal'),
    createBlock(1050, 150, 50, 50, 'finish'),
  ],
};

// Level 10: Checkpoint Challenge
const level10: Level = {
  id: 10,
  name: 'Long Run',
  difficulty: 'hard',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #1a0000 0%, #4a0000 50%, #8a0000 100%)',
  starTimes: [30, 45, 70],
  blocks: [
    createBlock(0, 500, 200, 100, 'normal'),
    createBlock(250, 485, 50, 15, 'spike'),
    createBlock(250, 500, 150, 100, 'normal'),
    createBlock(450, 450, 150, 150, 'normal'),
    // Checkpoint 1
    createBlock(650, 400, 50, 50, 'checkpoint'),
    createBlock(650, 450, 150, 150, 'normal'),
    createBlock(850, 500, 100, 100, 'rubber'),
    createBlock(1000, 350, 150, 250, 'normal'),
    createBlock(1200, 300, 80, 80, 'blackhole'),
    createBlock(1200, 500, 150, 100, 'normal'),
    // Checkpoint 2
    createBlock(1400, 450, 50, 50, 'checkpoint'),
    createBlock(1400, 500, 200, 100, 'normal'),
    createBlock(1650, 500, 100, 100, 'boost'),
    createBlock(1750, 500, 200, 100, 'normal'),
    createBlock(1900, 450, 50, 50, 'finish'),
  ],
};

// Level 11: Chaos Mix
const level11: Level = {
  id: 11,
  name: 'Chaos Mix',
  difficulty: 'hard',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #000428 0%, #004e92 50%, #00b4db 100%)',
  starTimes: [25, 40, 60],
  blocks: [
    createBlock(0, 500, 150, 100, 'normal'),
    createBlock(150, 500, 80, 100, 'boost'),
    createBlock(280, 485, 40, 15, 'spike'),
    createBlock(280, 500, 100, 100, 'normal'),
    createBlock(430, 500, 80, 80, 'rubber'),
    createBlock(560, 400, 60, 60, 'blackhole'),
    createBlock(560, 500, 150, 100, 'normal'),
    createBlock(760, 450, 150, 150, 'normal'),
    createBlock(960, 500, 50, 100, 'gravity_flip'),
    createBlock(1010, 0, 300, 100, 'normal'),
    createBlock(1010, 500, 50, 100, 'normal'),
    createBlock(1260, 500, 50, 100, 'gravity_flip'),
    createBlock(1310, 500, 150, 100, 'normal'),
    createBlock(1410, 450, 50, 50, 'finish'),
  ],
};

// Level 12: Speed Run
const level12: Level = {
  id: 12,
  name: 'Speed Run',
  difficulty: 'hard',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #0f0f0f 0%, #2a0845 50%, #6441a5 100%)',
  starTimes: [15, 22, 35],
  blocks: [
    createBlock(0, 500, 100, 100, 'normal'),
    createBlock(100, 500, 80, 100, 'boost'),
    createBlock(180, 500, 100, 100, 'normal'),
    createBlock(330, 485, 40, 15, 'spike'),
    createBlock(330, 500, 100, 100, 'normal'),
    createBlock(430, 500, 80, 100, 'boost'),
    createBlock(510, 500, 100, 100, 'normal'),
    createBlock(660, 485, 40, 15, 'spike'),
    createBlock(660, 500, 100, 100, 'normal'),
    createBlock(760, 500, 80, 100, 'boost'),
    createBlock(840, 500, 100, 100, 'normal'),
    createBlock(1040, 485, 100, 15, 'spike'),
    createBlock(1040, 500, 150, 100, 'normal'),
    createBlock(1190, 500, 80, 100, 'boost'),
    createBlock(1270, 500, 130, 100, 'normal'),
    createBlock(1350, 450, 50, 50, 'finish'),
  ],
};

// Level 13: Precision Jump
const level13: Level = {
  id: 13,
  name: 'Precision',
  difficulty: 'hard',
  spawnX: 50,
  spawnY: 300,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #141e30 0%, #243b55 50%, #3a5f7d 100%)',
  starTimes: [28, 42, 65],
  blocks: [
    createBlock(0, 400, 100, 100, 'normal'),
    createBlock(180, 350, 80, 80, 'normal'),
    createBlock(340, 300, 80, 80, 'normal'),
    createBlock(500, 250, 80, 80, 'normal'),
    createBlock(660, 200, 80, 80, 'normal'),
    createBlock(820, 250, 80, 80, 'normal'),
    createBlock(980, 300, 80, 80, 'normal'),
    createBlock(1140, 350, 80, 80, 'normal'),
    createBlock(1300, 400, 150, 100, 'normal'),
    createBlock(1400, 350, 50, 50, 'finish'),
  ],
};

// Level 14: Bounce House
const level14: Level = {
  id: 14,
  name: 'Bounce House',
  difficulty: 'hard',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #200122 0%, #6f0000 50%, #e00000 100%)',
  starTimes: [20, 32, 48],
  blocks: [
    createBlock(0, 500, 100, 100, 'normal'),
    createBlock(150, 500, 80, 100, 'rubber'),
    createBlock(300, 350, 80, 80, 'rubber'),
    createBlock(450, 200, 80, 80, 'rubber'),
    createBlock(600, 350, 80, 80, 'rubber'),
    createBlock(750, 500, 80, 100, 'rubber'),
    createBlock(900, 350, 80, 80, 'rubber'),
    createBlock(1050, 200, 80, 80, 'rubber'),
    createBlock(1200, 350, 100, 100, 'normal'),
    createBlock(1250, 300, 50, 50, 'finish'),
  ],
};

// Level 15: Black Hole Gauntlet
const level15: Level = {
  id: 15,
  name: 'Singularity',
  difficulty: 'extreme',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #000000 0%, #1a0033 50%, #330066 100%)',
  starTimes: [30, 45, 70],
  blocks: [
    createBlock(0, 500, 150, 100, 'normal'),
    createBlock(200, 380, 60, 60, 'blackhole'),
    createBlock(200, 500, 100, 100, 'normal'),
    createBlock(350, 280, 60, 60, 'blackhole'),
    createBlock(350, 500, 100, 100, 'normal'),
    createBlock(500, 380, 60, 60, 'blackhole'),
    createBlock(500, 500, 100, 100, 'normal'),
    createBlock(650, 500, 100, 100, 'boost'),
    createBlock(750, 500, 100, 100, 'normal'),
    createBlock(900, 300, 80, 80, 'blackhole'),
    createBlock(900, 500, 100, 100, 'normal'),
    createBlock(1050, 500, 150, 100, 'normal'),
    createBlock(1150, 450, 50, 50, 'finish'),
  ],
};

// Level 16: Flip Master
const level16: Level = {
  id: 16,
  name: 'Flip Master',
  difficulty: 'extreme',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #1a1a1a 0%, #2d3436 50%, #636e72 100%)',
  starTimes: [35, 50, 75],
  blocks: [
    createBlock(0, 500, 150, 100, 'normal'),
    createBlock(150, 500, 50, 100, 'gravity_flip'),
    createBlock(200, 0, 300, 100, 'normal'),
    createBlock(500, 0, 50, 100, 'gravity_flip'),
    createBlock(500, 500, 50, 100, 'normal'),
    createBlock(550, 500, 200, 100, 'normal'),
    createBlock(750, 500, 50, 100, 'gravity_flip'),
    createBlock(800, 0, 250, 100, 'normal'),
    createBlock(1050, 0, 50, 100, 'gravity_flip'),
    createBlock(1050, 500, 50, 100, 'normal'),
    createBlock(1100, 500, 150, 100, 'normal'),
    createBlock(1200, 450, 50, 50, 'finish'),
  ],
};

// Level 17: The Gauntlet
const level17: Level = {
  id: 17,
  name: 'The Gauntlet',
  difficulty: 'extreme',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #000000 0%, #3d0000 50%, #7d0000 100%)',
  starTimes: [40, 60, 90],
  blocks: [
    createBlock(0, 500, 100, 100, 'normal'),
    createBlock(150, 485, 40, 15, 'spike'),
    createBlock(150, 500, 80, 100, 'normal'),
    createBlock(280, 500, 60, 100, 'rubber'),
    createBlock(390, 380, 50, 50, 'blackhole'),
    createBlock(390, 500, 100, 100, 'normal'),
    createBlock(540, 500, 50, 100, 'gravity_flip'),
    createBlock(590, 0, 200, 100, 'normal'),
    createBlock(700, 85, 40, 15, 'spike'),
    createBlock(790, 0, 50, 100, 'gravity_flip'),
    createBlock(790, 500, 50, 100, 'normal'),
    createBlock(840, 500, 100, 100, 'boost'),
    createBlock(990, 485, 60, 15, 'spike'),
    createBlock(990, 500, 100, 100, 'normal'),
    createBlock(1140, 500, 60, 100, 'rubber'),
    createBlock(1250, 350, 100, 250, 'normal'),
    createBlock(1300, 300, 50, 50, 'finish'),
  ],
};

// Level 18: Final Challenge
const level18: Level = {
  id: 18,
  name: 'Final Challenge',
  difficulty: 'extreme',
  spawnX: 50,
  spawnY: 400,
  gravity: 0.6,
  background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a2e 50%, #ff0066 100%)',
  starTimes: [50, 75, 110],
  blocks: [
    createBlock(0, 500, 100, 100, 'normal'),
    createBlock(100, 500, 50, 100, 'boost'),
    createBlock(200, 485, 40, 15, 'spike'),
    createBlock(200, 500, 100, 100, 'normal'),
    createBlock(350, 500, 60, 100, 'rubber'),
    createBlock(460, 350, 50, 50, 'blackhole'),
    createBlock(460, 500, 100, 100, 'normal'),
    createBlock(600, 400, 60, 60, 'checkpoint'),
    createBlock(600, 460, 100, 140, 'normal'),
    createBlock(750, 500, 50, 100, 'gravity_flip'),
    createBlock(800, 0, 200, 100, 'normal'),
    createBlock(850, 85, 40, 15, 'spike'),
    createBlock(950, 85, 40, 15, 'spike'),
    createBlock(1000, 0, 50, 100, 'gravity_flip'),
    createBlock(1000, 500, 50, 100, 'normal'),
    createBlock(1050, 500, 80, 100, 'boost'),
    createBlock(1180, 485, 60, 15, 'spike'),
    createBlock(1180, 500, 100, 100, 'normal'),
    createBlock(1330, 500, 60, 100, 'rubber'),
    createBlock(1430, 280, 60, 60, 'blackhole'),
    createBlock(1430, 500, 100, 100, 'normal'),
    createBlock(1550, 350, 60, 60, 'checkpoint'),
    createBlock(1550, 410, 100, 190, 'normal'),
    createBlock(1700, 500, 80, 100, 'boost'),
    createBlock(1830, 485, 50, 15, 'spike'),
    createBlock(1830, 500, 100, 100, 'normal'),
    createBlock(1980, 500, 100, 100, 'normal'),
    createBlock(2030, 450, 50, 50, 'finish'),
  ],
};

export const LEVELS: Level[] = [
  level1, level2, level3, level4, level5, level6,
  level7, level8, level9, level10, level11, level12,
  level13, level14, level15, level16, level17, level18
];

export const getLevelById = (id: number): Level | undefined => LEVELS.find(l => l.id === id);
export const getTotalLevels = () => LEVELS.length;
