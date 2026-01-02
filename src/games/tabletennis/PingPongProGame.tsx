import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Play, Pause, Volume2, VolumeX, Trophy, Settings, 
  ChevronLeft, Star, Lock, Zap, Users, Target
} from 'lucide-react';
import { GameState, GameScreen, GameMode, Hero, Table, Particle, PowerUp, GameProgress } from './types';
import { TABLES, getTableById, getUnlockedTables, getAIDifficulty } from './tables';
import { HEROES, getHeroById, getUnlockedHeroes, getHeroesByGender } from './heroes';
import { storage } from './storage';
import { tableTennisAudio } from './audio';
import { POWER_UP_CONFIGS, getPowerUpConfig } from './powerups';
import { 
  renderTable, renderPlayer, renderBall, renderPowerUp, 
  renderParticles, renderHitIndicator, renderScore, renderTimingBar 
} from './renderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const createInitialPlayer = (hero: Hero, isPlayer: boolean) => ({
  x: isPlayer ? 100 : CANVAS_WIDTH - 140,
  y: CANVAS_HEIGHT / 2 - 25,
  width: 40,
  height: 50,
  speed: hero.stats.speed,
  power: hero.stats.power,
  timing: hero.stats.timing,
  spin: hero.stats.spin,
  name: hero.name,
  avatar: hero.avatar,
  isServing: isPlayer,
  score: 0,
  games: 0,
  sets: 0,
});

const createInitialBall = () => ({
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  vx: 0,
  vy: 0,
  radius: 6,
  spin: 0,
  speed: 0,
  visible: false,
  trajectory: [] as { x: number; y: number }[],
  bounceCount: 0,
});

export default function PingPongProGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);

  const [screen, setScreen] = useState<GameScreen>('menu');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('quickMatch');
  const [progress, setProgress] = useState<GameProgress>(storage.loadProgress());
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(progress.soundEnabled);
  const [displayScore, setDisplayScore] = useState({ player: [0, 0], opponent: [0, 0] });
  const [matchResult, setMatchResult] = useState<any>(null);
  const [lastHitQuality, setLastHitQuality] = useState<string | null>(null);

  // Initialize game
  useEffect(() => {
    const hero = getHeroById(progress.selectedHero);
    if (hero) setSelectedHero(hero);
    const tables = getUnlockedTables(progress.currentLevel);
    if (tables.length > 0) setSelectedTable(tables[0]);
  }, []);

  // Sound toggle
  useEffect(() => {
    tableTennisAudio.setEnabled(soundEnabled);
    const newProgress = { ...progress, soundEnabled };
    setProgress(newProgress);
    storage.saveProgress(newProgress);
  }, [soundEnabled]);

  const initGame = useCallback(() => {
    if (!selectedHero || !selectedTable) return;

    const opponent = HEROES.find(h => h.id !== selectedHero.id) || HEROES[1];
    
    gameStateRef.current = {
      screen: 'playing',
      mode: gameMode,
      currentTable: selectedTable.id,
      player: createInitialPlayer(selectedHero, true),
      opponent: createInitialPlayer(opponent, false),
      ball: createInitialBall(),
      playerScore: [0, 0],
      opponentScore: [0, 0],
      serving: 'player',
      rallyCount: 0,
      matchTime: 0,
      activePowerUps: [],
      powerUpsOnCourt: [],
      hitWindow: null,
      lastHitQuality: null,
      isPaused: false,
      slowMotionActive: false,
      slowMotionStartTime: 0,
      slowMotionDuration: 0,
      clickToHitActive: false,
      targetClickPos: null,
    };

    particlesRef.current = [];
    setDisplayScore({ player: [0, 0], opponent: [0, 0] });
    setIsPaused(false);
    setScreen('playing');
    
    setTimeout(() => startServe('player'), 500);
  }, [selectedHero, selectedTable, gameMode]);

  const startServe = (server: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    gs.serving = server;
    gs.ball.visible = true;
    gs.ball.bounced = false;
    
    if (server === 'player') {
      gs.ball.x = gs.player.x + gs.player.width + 15;
      gs.ball.y = gs.player.y + gs.player.height / 2;
      gs.ball.vx = 8;
      gs.ball.vy = -1 + Math.random() * 2;
    } else {
      gs.ball.x = gs.opponent.x - 15;
      gs.ball.y = gs.opponent.y + gs.opponent.height / 2;
      gs.ball.vx = -8;
      gs.ball.vy = -1 + Math.random() * 2;
    }
    
    gs.ball.speed = Math.sqrt(gs.ball.vx ** 2 + gs.ball.vy ** 2);
    gs.hitWindow = { start: Date.now(), end: Date.now() + 1200 };
    
    tableTennisAudio.playHit();
  };

  const handleInput = useCallback((clientY: number) => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    
    const gs = gameStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Move player
    gs.player.y = Math.max(80, Math.min(CANVAS_HEIGHT - gs.player.height - 80, y - gs.player.height / 2));

    // Check if ball is in hit range
    if (gs.hitWindow && gs.ball.visible) {
      const hitZone = {
        x: gs.player.x + gs.player.width,
        y: gs.player.y,
        width: 50,
        height: gs.player.height + 15,
      };

      if (
        gs.ball.x > hitZone.x - 15 &&
        gs.ball.x < hitZone.x + hitZone.width &&
        gs.ball.y > hitZone.y - 8 &&
        gs.ball.y < hitZone.y + hitZone.height + 8
      ) {
        const now = Date.now();
        const windowDuration = gs.hitWindow.end - gs.hitWindow.start;
        const progress = (now - gs.hitWindow.start) / windowDuration;
        
        let quality: 'perfect' | 'good' | 'early' | 'late' | 'miss';
        let powerMultiplier = 1;
        let spinBonus = 0;
        
        if (progress >= 0.4 && progress <= 0.6) {
          quality = 'perfect';
          powerMultiplier = 1.4;
          spinBonus = 3;
          tableTennisAudio.playSmash();
          addParticles(gs.ball.x, gs.ball.y, 'spark', 12);
        } else if (progress >= 0.25 && progress <= 0.75) {
          quality = 'good';
          powerMultiplier = 1.15;
          spinBonus = 1;
          tableTennisAudio.playHit();
          addParticles(gs.ball.x, gs.ball.y, 'bounce', 6);
        } else if (progress < 0.25) {
          quality = 'early';
          powerMultiplier = 0.85;
          tableTennisAudio.playHit();
        } else {
          quality = 'late';
          powerMultiplier = 0.85;
          tableTennisAudio.playHit();
        }

        gs.lastHitQuality = quality;
        setLastHitQuality(quality);
        setTimeout(() => setLastHitQuality(null), 700);

        // Return ball
        const baseSpeed = 9 + gs.player.power * 0.4;
        const speed = baseSpeed * powerMultiplier;
        const angle = (y - gs.ball.y) * 0.015;
        
        gs.ball.vx = speed;
        gs.ball.vy = angle * speed * 0.4;
        gs.ball.speed = speed;
        gs.ball.spin = (Math.random() - 0.5) * 2 + spinBonus;
        gs.ball.bounced = false;
        
        gs.hitWindow = null;
        gs.rallyCount++;
      }
    }
  }, []);

  const addParticles = (x: number, y: number, type: Particle['type'], count: number) => {
    const colors = type === 'spark' 
      ? ['#f97316', '#fb923c', '#ffffff']
      : type === 'bounce'
      ? ['#ffffff', '#fbbf24']
      : ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        maxLife: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3,
        type,
      });
    }
  };

  const scorePoint = (scorer: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    if (scorer === 'player') {
      gs.playerScore[0]++;
      tableTennisAudio.playPoint();
      addParticles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'confetti', 18);
    } else {
      gs.opponentScore[0]++;
      tableTennisAudio.playMiss();
    }

    setDisplayScore({
      player: [...gs.playerScore] as [number, number],
      opponent: [...gs.opponentScore] as [number, number],
    });

    // Check for game win (11 points, win by 2)
    const playerPts = gs.playerScore[0];
    const opponentPts = gs.opponentScore[0];
    
    if ((playerPts >= 11 || opponentPts >= 11) && Math.abs(playerPts - opponentPts) >= 2) {
      endMatch(playerPts > opponentPts);
      return;
    }

    // Service change every 2 points
    const totalPoints = playerPts + opponentPts;
    const newServer = Math.floor(totalPoints / 2) % 2 === 0 ? 'player' : 'opponent';
    
    gs.ball.visible = false;
    setTimeout(() => startServe(newServer), 800);
  };

  const endMatch = (playerWon: boolean) => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    const coinsEarned = playerWon ? 40 + gs.rallyCount * 2 : 8;
    const result = {
      won: playerWon,
      playerScore: gs.playerScore[0],
      opponentScore: gs.opponentScore[0],
      rallies: gs.rallyCount,
      accuracy: 0.78,
      avgReactionTime: 320,
      coinsEarned,
      powerUpsUsed: 0,
    };

    setMatchResult(result);

    const newProgress = { ...progress };
    newProgress.coins += coinsEarned;
    newProgress.totalMatches++;
    if (playerWon) {
      newProgress.totalWins++;
      newProgress.totalRallies += gs.rallyCount;
      if (gameMode === 'career' && selectedTable) {
        if (!newProgress.completedLevels.includes(selectedTable.id)) {
          newProgress.completedLevels.push(selectedTable.id);
        }
        if (selectedTable.id >= newProgress.highestLevel) {
          newProgress.highestLevel = selectedTable.id + 1;
          newProgress.currentLevel = selectedTable.id + 1;
        }
      }
    }
    
    setProgress(newProgress);
    storage.saveProgress(newProgress);

    if (playerWon) tableTennisAudio.playWin();

    setScreen('matchEnd');
  };

  // Game loop
  useEffect(() => {
    if (screen !== 'playing') return;

    const gameLoop = (timestamp: number) => {
      if (!gameStateRef.current || !canvasRef.current) return;
      
      const gs = gameStateRef.current;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      if (!gs.isPaused) {
        gs.matchTime += deltaTime;

        if (gs.ball.visible) {
          const timeScale = gs.slowMotionActive ? 0.35 : 1;
          
          // Ball physics - slight gravity and spin effect
          gs.ball.vy += 0.08 * timeScale;
          gs.ball.vy += gs.ball.spin * 0.02 * timeScale;
          
          gs.ball.x += gs.ball.vx * timeScale;
          gs.ball.y += gs.ball.vy * timeScale;

          // Table surface bounce
          const tableTop = 120;
          const tableBottom = CANVAS_HEIGHT - 120;
          
          if (gs.ball.y > tableBottom) {
            if (!gs.ball.bounced) {
              gs.ball.bounced = true;
              gs.ball.vy *= -0.8;
              gs.ball.y = tableBottom;
              tableTennisAudio.playBounce();
              addParticles(gs.ball.x, gs.ball.y, 'bounce', 4);
            } else {
              // Double bounce = point
              scorePoint(gs.ball.vx > 0 ? 'opponent' : 'player');
            }
          }
          
          if (gs.ball.y < tableTop) {
            gs.ball.vy *= -0.8;
            gs.ball.y = tableTop;
          }

          // Net collision
          if (Math.abs(gs.ball.x - CANVAS_WIDTH / 2) < 5 && gs.ball.y > tableTop) {
            if (gs.ball.y > CANVAS_HEIGHT / 2 - 20) {
              gs.ball.vx *= -0.5;
              tableTennisAudio.playNet();
            }
          }

          // Scoring
          if (gs.ball.x < 60) {
            scorePoint('opponent');
          } else if (gs.ball.x > CANVAS_WIDTH - 60) {
            scorePoint('player');
          }

          // AI opponent
          const difficulty = getAIDifficulty(gs.currentTable);
          const targetY = gs.ball.y - gs.opponent.height / 2;
          const aiSpeed = 4 + difficulty * 0.4;
          
          if (Math.abs(gs.opponent.y - targetY) > 4) {
            gs.opponent.y += (targetY - gs.opponent.y) * 0.07 * aiSpeed / 4;
          }
          gs.opponent.y = Math.max(80, Math.min(CANVAS_HEIGHT - gs.opponent.height - 80, gs.opponent.y));

          // AI hit
          if (
            gs.ball.vx < 0 &&
            gs.ball.x < gs.opponent.x + 25 &&
            gs.ball.x > gs.opponent.x - 15 &&
            gs.ball.y > gs.opponent.y - 8 &&
            gs.ball.y < gs.opponent.y + gs.opponent.height + 8
          ) {
            const hitChance = 0.75 + difficulty * 0.08;
            if (Math.random() < hitChance) {
              const speed = 7 + difficulty + Math.random() * 1.5;
              
              gs.ball.vx = -speed;
              gs.ball.vy = (Math.random() - 0.5) * 3;
              gs.ball.spin = (Math.random() - 0.5) * 2;
              gs.ball.bounced = false;
              
              tableTennisAudio.playHit();
              addParticles(gs.ball.x, gs.ball.y, 'bounce', 4);
              
              gs.hitWindow = { start: Date.now(), end: Date.now() + 1000 - difficulty * 80 };
            }
          }
        }

        // Update particles
        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15;
          p.life -= 0.025;
          return p.life > 0;
        });

        if (gs.slowMotionActive && Date.now() > gs.slowMotionStartTime + gs.slowMotionDuration) {
          gs.slowMotionActive = false;
        }
      }

      // Render
      const table = getTableById(gs.currentTable);
      if (table) {
        renderTable(ctx, table, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      renderPlayer(ctx, gs.player, true);
      renderPlayer(ctx, gs.opponent, false);
      renderBall(ctx, gs.ball);
      
      gs.powerUpsOnCourt.forEach(p => renderPowerUp(ctx, p));
      renderParticles(ctx, particlesRef.current);
      
      if (lastHitQuality) {
        renderHitIndicator(ctx, lastHitQuality, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }
      
      renderScore(ctx, gs.playerScore, gs.opponentScore, gs.serving, CANVAS_WIDTH);
      renderTimingBar(ctx, gs.hitWindow, CANVAS_WIDTH, CANVAS_HEIGHT);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [screen, isPaused, lastHitQuality]);

  // Input handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || screen !== 'playing') return;

    const handleMouseMove = (e: MouseEvent) => handleInput(e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleInput(e.touches[0].clientY);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [screen, handleInput]);

  // UI Screens
  const MenuScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-orange-900 via-red-800 to-rose-900 rounded-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
          🏓 PING PONG PRO
        </h1>
        <p className="text-orange-200 text-lg">Table Tennis Championship</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          onClick={() => setScreen('modeSelect')}
          className="h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-bold"
        >
          <Play className="mr-2 h-6 w-6" /> PLAY NOW
        </Button>

        <Button
          onClick={() => setScreen('heroSelect')}
          variant="outline"
          className="h-12 border-orange-400 text-orange-100 hover:bg-orange-800/50"
        >
          <Users className="mr-2 h-5 w-5" /> Select Player
        </Button>

        <Button
          onClick={() => setScreen('tableSelect')}
          variant="outline"
          className="h-12 border-orange-400 text-orange-100 hover:bg-orange-800/50"
        >
          <Target className="mr-2 h-5 w-5" /> Select Table
        </Button>

        <Button
          onClick={() => setScreen('settings')}
          variant="ghost"
          className="h-12 text-orange-200 hover:bg-orange-800/30"
        >
          <Settings className="mr-2 h-5 w-5" /> Settings
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-6 text-orange-200">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span>{progress.totalWins} Wins</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-400" />
          <span>{progress.coins} Coins</span>
        </div>
      </div>
    </div>
  );

  const ModeSelectScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-orange-900 via-red-800 to-rose-900 rounded-xl p-8">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-orange-200">
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">SELECT MODE</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {[
          { mode: 'career' as GameMode, icon: '🏆', title: 'Career', desc: 'Climb the rankings' },
          { mode: 'quickMatch' as GameMode, icon: '⚡', title: 'Quick Match', desc: 'Fast action' },
          { mode: 'practice' as GameMode, icon: '🎯', title: 'Practice', desc: 'Master your spin' },
          { mode: 'challenge' as GameMode, icon: '🔥', title: 'Challenge', desc: 'Intense matches' },
        ].map(({ mode, icon, title, desc }) => (
          <Card
            key={mode}
            onClick={() => { setGameMode(mode); initGame(); }}
            className="p-6 bg-gradient-to-br from-orange-800/50 to-red-900/50 border-orange-600/50 hover:border-orange-400 cursor-pointer transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">{icon}</div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-orange-300">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const HeroSelectScreen = () => {
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const heroes = getHeroesByGender(gender);

    return (
      <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-orange-900 via-red-800 to-rose-900 rounded-xl p-6">
        <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-orange-200">
          <ChevronLeft className="h-5 w-5" /> Back
        </Button>

        <h2 className="text-3xl font-bold text-white mb-4">SELECT PLAYER</h2>

        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setGender('male')}
            variant={gender === 'male' ? 'default' : 'outline'}
            className={gender === 'male' ? 'bg-orange-600' : 'border-orange-500 text-orange-200'}
          >
            Male
          </Button>
          <Button
            onClick={() => setGender('female')}
            variant={gender === 'female' ? 'default' : 'outline'}
            className={gender === 'female' ? 'bg-orange-600' : 'border-orange-500 text-orange-200'}
          >
            Female
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-2xl overflow-y-auto max-h-[350px]">
          {heroes.map(hero => {
            const isUnlocked = progress.unlockedHeroes.includes(hero.id);
            const isSelected = selectedHero?.id === hero.id;

            return (
              <Card
                key={hero.id}
                onClick={() => {
                  if (isUnlocked) {
                    setSelectedHero(hero);
                    const newProgress = { ...progress, selectedHero: hero.id };
                    setProgress(newProgress);
                    storage.saveProgress(newProgress);
                  } else if (progress.coins >= hero.unlockCost) {
                    const newProgress = {
                      ...progress,
                      coins: progress.coins - hero.unlockCost,
                      unlockedHeroes: [...progress.unlockedHeroes, hero.id],
                      selectedHero: hero.id,
                    };
                    setProgress(newProgress);
                    storage.saveProgress(newProgress);
                    setSelectedHero(hero);
                  }
                }}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-orange-600 border-orange-400 scale-105'
                    : isUnlocked
                    ? 'bg-orange-800/50 border-orange-600/50 hover:border-orange-400'
                    : 'bg-gray-800/50 border-gray-600/50'
                }`}
              >
                <div className="text-4xl mb-2">{hero.avatar}</div>
                <h3 className="font-bold text-white text-sm">{hero.name}</h3>
                {!isUnlocked && (
                  <div className="flex items-center gap-1 text-yellow-400 text-xs mt-1">
                    <Lock className="h-3 w-3" />
                    {hero.unlockCost} coins
                  </div>
                )}
                {isUnlocked && (
                  <div className="mt-2 space-y-1">
                    <StatBar label="SPD" value={hero.stats.speed} color="bg-orange-400" />
                    <StatBar label="PWR" value={hero.stats.power} color="bg-red-400" />
                    <StatBar label="SPN" value={hero.stats.spin} color="bg-yellow-400" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="flex justify-between text-xs text-orange-300">
      <span>{label}</span>
      <div className="w-16 bg-orange-900 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );

  const TableSelectScreen = () => (
    <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-orange-900 via-red-800 to-rose-900 rounded-xl p-6">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-orange-200">
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-6">SELECT TABLE</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {TABLES.map(table => {
          const isUnlocked = progress.currentLevel >= table.unlockLevel;
          const isSelected = selectedTable?.id === table.id;

          return (
            <Card
              key={table.id}
              onClick={() => isUnlocked && setSelectedTable(table)}
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? 'border-orange-400 scale-105' : isUnlocked ? 'border-orange-600/50 hover:border-orange-400' : 'border-gray-600/50 opacity-50'
              }`}
              style={{
                background: isUnlocked ? `linear-gradient(135deg, ${table.bgColors[0]}, ${table.bgColors[1]})` : '#1f2937',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">{table.name}</h3>
                {!isUnlocked && <Lock className="h-4 w-4 text-gray-400" />}
                {isUnlocked && progress.completedLevels.includes(table.id) && (
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <p className="text-xs text-white/70">{table.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-orange-900 via-red-800 to-rose-900 rounded-xl p-8">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-orange-200">
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">SETTINGS</h2>

      <div className="space-y-6 w-full max-w-xs">
        <div className="flex items-center justify-between p-4 bg-orange-800/30 rounded-lg">
          <span className="text-white font-medium">Sound</span>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="icon" className="text-orange-200">
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
        </div>

        <div className="p-4 bg-orange-800/30 rounded-lg">
          <h3 className="text-white font-medium mb-3">Difficulty</h3>
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as const).map(diff => (
              <Button
                key={diff}
                onClick={() => {
                  const newProgress = { ...progress, difficulty: diff };
                  setProgress(newProgress);
                  storage.saveProgress(newProgress);
                }}
                variant={progress.difficulty === diff ? 'default' : 'outline'}
                className={progress.difficulty === diff ? 'bg-orange-600' : 'border-orange-500 text-orange-200'}
                size="sm"
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => { storage.clearProgress(); setProgress(storage.loadProgress()); }}
          variant="destructive"
          className="w-full"
        >
          Reset Progress
        </Button>
      </div>
    </div>
  );

  const MatchEndScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-orange-900 via-red-800 to-rose-900 rounded-xl p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">{matchResult?.won ? '🏆' : '😢'}</div>
        <h2 className="text-4xl font-black text-white mb-2">{matchResult?.won ? 'VICTORY!' : 'DEFEAT'}</h2>
        <p className="text-orange-200 text-xl mb-6">{matchResult?.playerScore} - {matchResult?.opponentScore}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-orange-800/30 p-4 rounded-lg">
            <p className="text-orange-300 text-sm">Rallies</p>
            <p className="text-2xl font-bold text-white">{matchResult?.rallies}</p>
          </div>
          <div className="bg-orange-800/30 p-4 rounded-lg">
            <p className="text-orange-300 text-sm">Coins Earned</p>
            <p className="text-2xl font-bold text-yellow-400">+{matchResult?.coinsEarned}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => setScreen('menu')} variant="outline" className="border-orange-400 text-orange-100">
            Menu
          </Button>
          <Button onClick={initGame} className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold">
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );

  const PausedOverlay = () => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-6">PAUSED</h2>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => { setIsPaused(false); if (gameStateRef.current) gameStateRef.current.isPaused = false; }}
            className="bg-orange-600 hover:bg-orange-500"
          >
            <Play className="mr-2 h-5 w-5" /> Resume
          </Button>
          <Button onClick={() => setScreen('menu')} variant="outline" className="border-orange-400 text-orange-100">
            Quit to Menu
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {screen === 'menu' && <MenuScreen />}
      {screen === 'modeSelect' && <ModeSelectScreen />}
      {screen === 'heroSelect' && <HeroSelectScreen />}
      {screen === 'tableSelect' && <TableSelectScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'matchEnd' && <MatchEndScreen />}
      
      {screen === 'playing' && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2 px-2">
            <Button
              onClick={() => { setIsPaused(true); if (gameStateRef.current) gameStateRef.current.isPaused = true; }}
              variant="ghost" size="icon" className="text-orange-200"
            >
              <Pause className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-orange-200">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>{progress.coins}</span>
            </div>
            <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="icon" className="text-orange-200">
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full rounded-xl border-2 border-orange-600/50 shadow-2xl cursor-none"
          />
          
          {isPaused && <PausedOverlay />}
        </div>
      )}
    </div>
  );
}
