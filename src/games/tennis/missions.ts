// Tennis Hero Career Mode - Mission System

export interface MissionMatch {
  id: string;
  country: string;
  matchNumber: number;
  opponentName: string;
  difficulty: number; // 1-8
  requiredPowerLevel: number; // Hero stat level required to unlock
  reward: number;
  description: string;
}

export interface CountryMission {
  id: string;
  name: string;
  flag: string;
  description: string;
  matches: MissionMatch[];
  totalReward: number;
}

export const CAREER_MISSIONS: CountryMission[] = [
  {
    id: 'usa',
    name: 'United States',
    flag: '🇺🇸',
    description: 'Start your journey in New York',
    totalReward: 1500,
    matches: [
      {
        id: 'usa_1',
        country: 'USA',
        matchNumber: 1,
        opponentName: 'Jordan Smith',
        difficulty: 1,
        requiredPowerLevel: 1,
        reward: 200,
        description: 'Warm up match against a local player',
      },
      {
        id: 'usa_2',
        country: 'USA',
        matchNumber: 2,
        opponentName: 'Sarah Williams',
        difficulty: 1,
        requiredPowerLevel: 1,
        reward: 250,
        description: 'Face the state champion',
      },
      {
        id: 'usa_3',
        country: 'USA',
        matchNumber: 3,
        opponentName: 'Marcus Johnson',
        difficulty: 2,
        requiredPowerLevel: 2,
        reward: 300,
        description: 'Challenge the national semi-finalist',
      },
      {
        id: 'usa_4',
        country: 'USA',
        matchNumber: 4,
        opponentName: 'Lisa Anderson',
        difficulty: 2,
        requiredPowerLevel: 2,
        reward: 350,
        description: 'Take on a pro player from NYC',
      },
      {
        id: 'usa_5',
        country: 'USA',
        matchNumber: 5,
        opponentName: 'Alex Davis',
        difficulty: 3,
        requiredPowerLevel: 3,
        reward: 400,
        description: 'Final challenge: Face the US Tour Champion',
      },
    ],
  },
  {
    id: 'spain',
    name: 'Spain',
    flag: '🇪🇸',
    description: 'Master the clay courts of Madrid',
    totalReward: 2000,
    matches: [
      {
        id: 'spain_1',
        country: 'Spain',
        matchNumber: 1,
        opponentName: 'Carlos García',
        difficulty: 3,
        requiredPowerLevel: 3,
        reward: 300,
        description: 'Welcome to Spain - face a local Madrid player',
      },
      {
        id: 'spain_2',
        country: 'Spain',
        matchNumber: 2,
        opponentName: 'Isabel Rodríguez',
        difficulty: 3,
        requiredPowerLevel: 3,
        reward: 350,
        description: 'Spanish clay court specialist',
      },
      {
        id: 'spain_3',
        country: 'Spain',
        matchNumber: 3,
        opponentName: 'Miguel López',
        difficulty: 4,
        requiredPowerLevel: 4,
        reward: 400,
        description: 'Former Spanish Open finalist',
      },
      {
        id: 'spain_4',
        country: 'Spain',
        matchNumber: 4,
        opponentName: 'Daniela Martínez',
        difficulty: 4,
        requiredPowerLevel: 4,
        reward: 450,
        description: 'Spain\'s rising tennis star',
      },
      {
        id: 'spain_5',
        country: 'Spain',
        matchNumber: 5,
        opponentName: 'Rafael Santana',
        difficulty: 5,
        requiredPowerLevel: 5,
        reward: 500,
        description: 'Challenge the Spanish Tennis Legend',
      },
    ],
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    description: 'Compete on the legendary French courts',
    totalReward: 2500,
    matches: [
      {
        id: 'france_1',
        country: 'France',
        matchNumber: 1,
        opponentName: 'Pierre Dubois',
        difficulty: 4,
        requiredPowerLevel: 4,
        reward: 400,
        description: 'Paris clay court expert',
      },
      {
        id: 'france_2',
        country: 'France',
        matchNumber: 2,
        opponentName: 'Amélie Laurent',
        difficulty: 4,
        requiredPowerLevel: 4,
        reward: 450,
        description: 'French Open qualifier',
      },
      {
        id: 'france_3',
        country: 'France',
        matchNumber: 3,
        opponentName: 'Antoine Leclerc',
        difficulty: 5,
        requiredPowerLevel: 5,
        reward: 500,
        description: 'Former ATP top 100 player',
      },
      {
        id: 'france_4',
        country: 'France',
        matchNumber: 4,
        opponentName: 'Véronique Fontaine',
        difficulty: 5,
        requiredPowerLevel: 5,
        reward: 550,
        description: 'WTA tournament champion',
      },
      {
        id: 'france_5',
        country: 'France',
        matchNumber: 5,
        opponentName: 'Jean Rousseau',
        difficulty: 6,
        requiredPowerLevel: 6,
        reward: 600,
        description: 'Face France\'s greatest tennis player',
      },
    ],
  },
  {
    id: 'australia',
    name: 'Australia',
    flag: '🇦🇺',
    description: 'Test yourself on Australian hard courts',
    totalReward: 3000,
    matches: [
      {
        id: 'australia_1',
        country: 'Australia',
        matchNumber: 1,
        opponentName: 'Chris Thompson',
        difficulty: 5,
        requiredPowerLevel: 5,
        reward: 500,
        description: 'Sydney hard court specialist',
      },
      {
        id: 'australia_2',
        country: 'Australia',
        matchNumber: 2,
        opponentName: 'Emma Wilson',
        difficulty: 5,
        requiredPowerLevel: 5,
        reward: 550,
        description: 'Australian Open past finalist',
      },
      {
        id: 'australia_3',
        country: 'Australia',
        matchNumber: 3,
        opponentName: 'James Henderson',
        difficulty: 6,
        requiredPowerLevel: 6,
        reward: 600,
        description: 'Former ATP top 50 player',
      },
      {
        id: 'australia_4',
        country: 'Australia',
        matchNumber: 4,
        opponentName: 'Sophie Murphy',
        difficulty: 6,
        requiredPowerLevel: 6,
        reward: 650,
        description: 'WTA international champion',
      },
      {
        id: 'australia_5',
        country: 'Australia',
        matchNumber: 5,
        opponentName: 'Mark Stevens',
        difficulty: 7,
        requiredPowerLevel: 7,
        reward: 700,
        description: 'Australia\'s tennis icon',
      },
    ],
  },
  {
    id: 'japan',
    name: 'Japan',
    flag: '🇯🇵',
    description: 'Ultimate challenge - Face the best in Tokyo',
    totalReward: 3500,
    matches: [
      {
        id: 'japan_1',
        country: 'Japan',
        matchNumber: 1,
        opponentName: 'Hiroshi Tanaka',
        difficulty: 6,
        requiredPowerLevel: 6,
        reward: 600,
        description: 'Tokyo tournament champion',
      },
      {
        id: 'japan_2',
        country: 'Japan',
        matchNumber: 2,
        opponentName: 'Yuki Yamamoto',
        difficulty: 6,
        requiredPowerLevel: 6,
        reward: 650,
        description: 'Japanese Open finalist',
      },
      {
        id: 'japan_3',
        country: 'Japan',
        matchNumber: 3,
        opponentName: 'Kenji Nakamura',
        difficulty: 7,
        requiredPowerLevel: 7,
        reward: 700,
        description: 'Former WTA/ATP champion',
      },
      {
        id: 'japan_4',
        country: 'Japan',
        matchNumber: 4,
        opponentName: 'Sakura Sato',
        difficulty: 7,
        requiredPowerLevel: 7,
        reward: 750,
        description: 'World top 20 player',
      },
      {
        id: 'japan_5',
        country: 'Japan',
        matchNumber: 5,
        opponentName: 'Takeshi Yamada',
        difficulty: 8,
        requiredPowerLevel: 8,
        reward: 800,
        description: 'Challenge the World #1 player',
      },
    ],
  },
];

export const getMissionById = (missionId: string): MissionMatch | undefined => {
  for (const country of CAREER_MISSIONS) {
    const match = country.matches.find(m => m.id === missionId);
    if (match) return match;
  }
  return undefined;
};

export const getCountryById = (countryId: string): CountryMission | undefined => {
  return CAREER_MISSIONS.find(c => c.id === countryId);
};

export const getNextMission = (completedMissions: string[]): MissionMatch | undefined => {
  for (const country of CAREER_MISSIONS) {
    for (const match of country.matches) {
      if (!completedMissions.includes(match.id)) {
        return match;
      }
    }
  }
  return undefined;
};

export const getMissionProgress = (completedMissions: string[]) => {
  let totalMissions = 0;
  let completedCount = 0;

  for (const country of CAREER_MISSIONS) {
    totalMissions += country.matches.length;
    for (const match of country.matches) {
      if (completedMissions.includes(match.id)) {
        completedCount++;
      }
    }
  }

  return { totalMissions, completedCount, percentage: Math.round((completedCount / totalMissions) * 100) };
};
