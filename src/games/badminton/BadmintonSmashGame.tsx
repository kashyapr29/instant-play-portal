import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Play, Pause, Volume2, VolumeX, Trophy, Settings, 
  ChevronLeft, Star, Lock, Zap, Users, Target, Medal
} from 'lucide-react';
import { GameState, GameScreen, GameMode, Hero, Court, Particle, PowerUp, GameProgress } from './types';
import { COURTS, getCourtById, getUnlockedCourts, getAIDifficulty } from './courts';
import { HEROES, getHeroById, getUnlockedHeroes, getHeroesByGender } from './heroes';
import { storage } from './storage';
import { badmintonAudio } from './audio';
import { POWER_UP_CONFIGS, getPowerUpConfig } from './powerups';
import { 
  renderCourt, renderPlayer, renderShuttlecock, renderPowerUp, 
  renderParticles, renderHitIndicator, renderScore, renderTimingBar 
} from './renderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const createInitialPlayer = (hero: Hero, isPlayer: boolean) => ({
  x: isPlayer ? 120 : CANVAS_WIDTH - 160,
  y: CANVAS_HEIGHT / 2 - 30,
  width: 40,
  height: 60,
  speed: hero.stats.speed,
  power: hero.stats.power,
  timing: hero.stats.timing,
  smash: hero.stats.smash,
  name: hero.name,
  avatar: hero.avatar,
  isServing: isPlayer,
  score: 0,
  games: 0,
  sets: 0,
});

const createInitialShuttlecock = () => ({
  x: CANVAS_WIDTH / 2,
  y: CANVAS_HEIGHT / 2,
  vx: 0,
  vy: 0,
  radius: 8,
  spin: 0,
  speed: 0,
  visible: false,
  trajectory: [],
  isSmash: false,
});

export default function BadmintonSmashGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const gameStateRef = useRef<GameState | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);

  const [screen, setScreen] = useState<GameScreen>('menu');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
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
    const courts = getUnlockedCourts(progress.currentLevel);
    if (courts.length > 0) setSelectedCourt(courts[0]);
  }, []);

  // Sound toggle
  useEffect(() => {
    badmintonAudio.setEnabled(soundEnabled);
    const newProgress = { ...progress, soundEnabled };
    setProgress(newProgress);
    storage.saveProgress(newProgress);
  }, [soundEnabled]);

  const initGame = useCallback(() => {
    if (!selectedHero || !selectedCourt) return;

    const opponent = HEROES.find(h => h.id !== selectedHero.id) || HEROES[1];
    
    gameStateRef.current = {
      screen: 'playing',
      mode: gameMode,
      currentCourt: selectedCourt.id,
      player: createInitialPlayer(selectedHero, true),
      opponent: createInitialPlayer(opponent, false),
      shuttlecock: createInitialShuttlecock(),
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
    
    // Start serve
    setTimeout(() => startServe('player'), 500);
  }, [selectedHero, selectedCourt, gameMode]);

  const startServe = (server: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    gs.serving = server;
    gs.shuttlecock.visible = true;
    
    if (server === 'player') {
      gs.shuttlecock.x = gs.player.x + gs.player.width + 20;
      gs.shuttlecock.y = gs.player.y + gs.player.height / 2;
      gs.shuttlecock.vx = 6;
      gs.shuttlecock.vy = -2 + Math.random() * 4;
    } else {
      gs.shuttlecock.x = gs.opponent.x - 20;
      gs.shuttlecock.y = gs.opponent.y + gs.opponent.height / 2;
      gs.shuttlecock.vx = -6;
      gs.shuttlecock.vy = -2 + Math.random() * 4;
    }
    
    gs.shuttlecock.speed = Math.sqrt(gs.shuttlecock.vx ** 2 + gs.shuttlecock.vy ** 2);
    gs.shuttlecock.isSmash = false;
    gs.hitWindow = { start: Date.now(), end: Date.now() + 1500 };
    
    badmintonAudio.playHit();
  };

  const handleInput = useCallback((clientY: number) => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    
    const gs = gameStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    // Move player
    gs.player.y = Math.max(40, Math.min(CANVAS_HEIGHT - gs.player.height - 40, y - gs.player.height / 2));

    // Check if shuttlecock is in hit range
    if (gs.hitWindow && gs.shuttlecock.visible) {
      const hitZone = {
        x: gs.player.x + gs.player.width,
        y: gs.player.y,
        width: 60,
        height: gs.player.height + 20,
      };

      if (
        gs.shuttlecock.x > hitZone.x - 20 &&
        gs.shuttlecock.x < hitZone.x + hitZone.width &&
        gs.shuttlecock.y > hitZone.y - 10 &&
        gs.shuttlecock.y < hitZone.y + hitZone.height + 10
      ) {
        const now = Date.now();
        const windowDuration = gs.hitWindow.end - gs.hitWindow.start;
        const progress = (now - gs.hitWindow.start) / windowDuration;
        
        let quality: 'perfect' | 'good' | 'early' | 'late' | 'miss';
        let powerMultiplier = 1;
        
        if (progress >= 0.4 && progress <= 0.6) {
          quality = 'perfect';
          powerMultiplier = 1.5;
          badmintonAudio.playSmash();
          addParticles(gs.shuttlecock.x, gs.shuttlecock.y, 'spark', 15);
        } else if (progress >= 0.25 && progress <= 0.75) {
          quality = 'good';
          powerMultiplier = 1.2;
          badmintonAudio.playHit();
          addParticles(gs.shuttlecock.x, gs.shuttlecock.y, 'feather', 8);
        } else if (progress < 0.25) {
          quality = 'early';
          powerMultiplier = 0.8;
          badmintonAudio.playHit();
        } else {
          quality = 'late';
          powerMultiplier = 0.8;
          badmintonAudio.playHit();
        }

        gs.lastHitQuality = quality;
        setLastHitQuality(quality);
        setTimeout(() => setLastHitQuality(null), 800);

        // Check for power smash
        const hasPowerSmash = gs.activePowerUps.some(p => p.type === 'power_smash');
        if (hasPowerSmash || quality === 'perfect') {
          gs.shuttlecock.isSmash = true;
          powerMultiplier *= 1.3;
        }

        // Return shuttlecock
        const baseSpeed = 7 + gs.player.power * 0.5;
        const speed = baseSpeed * powerMultiplier;
        const angle = (y - gs.shuttlecock.y) * 0.02;
        
        gs.shuttlecock.vx = speed;
        gs.shuttlecock.vy = angle * speed * 0.5;
        gs.shuttlecock.speed = speed;
        gs.shuttlecock.spin = (Math.random() - 0.5) * 2;
        
        gs.hitWindow = null;
        gs.rallyCount++;
      }
    }
  }, []);

  const addParticles = (x: number, y: number, type: Particle['type'], count: number) => {
    const colors = type === 'spark' 
      ? ['#fbbf24', '#f59e0b', '#ffffff']
      : type === 'feather'
      ? ['#ffffff', '#e5e7eb', '#d1d5db']
      : ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        type,
      });
    }
  };

  const scorePoint = (scorer: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    if (scorer === 'player') {
      gs.playerScore[0]++;
      badmintonAudio.playPoint();
      addParticles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'confetti', 20);
    } else {
      gs.opponentScore[0]++;
      badmintonAudio.playMiss();
    }

    setDisplayScore({
      player: [...gs.playerScore] as [number, number],
      opponent: [...gs.opponentScore] as [number, number],
    });

    // Check for game win (21 points, win by 2)
    const playerPts = gs.playerScore[0];
    const opponentPts = gs.opponentScore[0];
    
    if ((playerPts >= 21 || opponentPts >= 21) && Math.abs(playerPts - opponentPts) >= 2) {
      endMatch(playerPts > opponentPts);
      return;
    }

    // Cap at 30
    if (playerPts >= 30 || opponentPts >= 30) {
      endMatch(playerPts > opponentPts);
      return;
    }

    // Next serve
    gs.shuttlecock.visible = false;
    setTimeout(() => startServe(scorer), 1000);
  };

  const endMatch = (playerWon: boolean) => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    const coinsEarned = playerWon ? 50 + gs.rallyCount * 2 : 10;
    const result = {
      won: playerWon,
      playerScore: gs.playerScore[0],
      opponentScore: gs.opponentScore[0],
      smashes: gs.rallyCount,
      accuracy: 0.75,
      avgReactionTime: 350,
      coinsEarned,
      powerUpsUsed: 0,
    };

    setMatchResult(result);

    // Update progress
    const newProgress = { ...progress };
    newProgress.coins += coinsEarned;
    newProgress.totalMatches++;
    if (playerWon) {
      newProgress.totalWins++;
      newProgress.totalSmashes += gs.rallyCount;
      if (gameMode === 'career' && selectedCourt) {
        if (!newProgress.completedLevels.includes(selectedCourt.id)) {
          newProgress.completedLevels.push(selectedCourt.id);
        }
        if (selectedCourt.id >= newProgress.highestLevel) {
          newProgress.highestLevel = selectedCourt.id + 1;
          newProgress.currentLevel = selectedCourt.id + 1;
        }
      }
    }
    
    setProgress(newProgress);
    storage.saveProgress(newProgress);

    if (playerWon) {
      badmintonAudio.playWin();
    }

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

        // Update shuttlecock physics
        if (gs.shuttlecock.visible) {
          const timeScale = gs.slowMotionActive ? 0.3 : 1;
          
          // Air resistance (shuttlecock slows down quickly)
          const drag = 0.98;
          gs.shuttlecock.vx *= drag;
          gs.shuttlecock.vy *= drag;
          
          // Gravity effect
          gs.shuttlecock.vy += 0.15 * timeScale;
          
          gs.shuttlecock.x += gs.shuttlecock.vx * timeScale;
          gs.shuttlecock.y += gs.shuttlecock.vy * timeScale;

          // Wall bounces (top/bottom)
          if (gs.shuttlecock.y < 50 || gs.shuttlecock.y > CANVAS_HEIGHT - 50) {
            gs.shuttlecock.vy *= -0.7;
            gs.shuttlecock.y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, gs.shuttlecock.y));
          }

          // Scoring
          if (gs.shuttlecock.x < 40) {
            scorePoint('opponent');
          } else if (gs.shuttlecock.x > CANVAS_WIDTH - 40) {
            scorePoint('player');
          }

          // AI opponent
          const difficulty = getAIDifficulty(gs.currentCourt);
          const targetY = gs.shuttlecock.y - gs.opponent.height / 2;
          const aiSpeed = 3 + difficulty * 0.5;
          
          if (Math.abs(gs.opponent.y - targetY) > 5) {
            gs.opponent.y += (targetY - gs.opponent.y) * 0.08 * aiSpeed / 3;
          }

          // AI hit
          if (
            gs.shuttlecock.vx < 0 &&
            gs.shuttlecock.x < gs.opponent.x + 30 &&
            gs.shuttlecock.x > gs.opponent.x - 20 &&
            gs.shuttlecock.y > gs.opponent.y - 10 &&
            gs.shuttlecock.y < gs.opponent.y + gs.opponent.height + 10
          ) {
            const hitChance = 0.7 + difficulty * 0.1;
            if (Math.random() < hitChance) {
              const speed = 5 + difficulty + Math.random() * 2;
              const isSmash = Math.random() < 0.2 + difficulty * 0.1;
              
              gs.shuttlecock.vx = -speed * (isSmash ? 1.3 : 1);
              gs.shuttlecock.vy = (Math.random() - 0.5) * 4;
              gs.shuttlecock.isSmash = isSmash;
              
              badmintonAudio.playHit();
              addParticles(gs.shuttlecock.x, gs.shuttlecock.y, 'feather', 5);
              
              gs.hitWindow = { start: Date.now(), end: Date.now() + 1200 - difficulty * 100 };
            }
          }
        }

        // Update particles
        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          p.life -= 0.02;
          return p.life > 0;
        });

        // Check slow motion expiry
        if (gs.slowMotionActive && Date.now() > gs.slowMotionStartTime + gs.slowMotionDuration) {
          gs.slowMotionActive = false;
        }
      }

      // Render
      const court = getCourtById(gs.currentCourt);
      if (court) {
        renderCourt(ctx, court, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      renderPlayer(ctx, gs.player, true);
      renderPlayer(ctx, gs.opponent, false);
      renderShuttlecock(ctx, gs.shuttlecock);
      
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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
    const handleClick = () => handleInput(canvasRef.current?.getBoundingClientRect().top || 0);

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [screen, handleInput]);

  // Menu Screen
  const MenuScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
          🏸 BADMINTON SMASH
        </h1>
        <p className="text-emerald-200 text-lg">Master the Art of Smashing</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          onClick={() => setScreen('modeSelect')}
          className="h-14 text-lg bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white font-bold"
        >
          <Play className="mr-2 h-6 w-6" /> PLAY NOW
        </Button>

        <Button
          onClick={() => setScreen('heroSelect')}
          variant="outline"
          className="h-12 border-emerald-400 text-emerald-100 hover:bg-emerald-800/50"
        >
          <Users className="mr-2 h-5 w-5" /> Select Hero
        </Button>

        <Button
          onClick={() => setScreen('courtSelect')}
          variant="outline"
          className="h-12 border-emerald-400 text-emerald-100 hover:bg-emerald-800/50"
        >
          <Target className="mr-2 h-5 w-5" /> Select Court
        </Button>

        <Button
          onClick={() => setScreen('settings')}
          variant="ghost"
          className="h-12 text-emerald-200 hover:bg-emerald-800/30"
        >
          <Settings className="mr-2 h-5 w-5" /> Settings
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-6 text-emerald-200">
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

  // Mode Select Screen
  const ModeSelectScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <Button
        onClick={() => setScreen('menu')}
        variant="ghost"
        className="absolute top-4 left-4 text-emerald-200"
      >
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">SELECT MODE</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {[
          { mode: 'career' as GameMode, icon: '🏆', title: 'Career', desc: 'Progress through courts' },
          { mode: 'quickMatch' as GameMode, icon: '⚡', title: 'Quick Match', desc: 'Jump into action' },
          { mode: 'practice' as GameMode, icon: '🎯', title: 'Practice', desc: 'Improve your skills' },
          { mode: 'challenge' as GameMode, icon: '🔥', title: 'Challenge', desc: 'Test your limits' },
        ].map(({ mode, icon, title, desc }) => (
          <Card
            key={mode}
            onClick={() => { setGameMode(mode); initGame(); }}
            className="p-6 bg-gradient-to-br from-emerald-800/50 to-green-900/50 border-emerald-600/50 hover:border-emerald-400 cursor-pointer transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">{icon}</div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-emerald-300">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  // Hero Select Screen
  const HeroSelectScreen = () => {
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const heroes = getHeroesByGender(gender);

    return (
      <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-6">
        <Button
          onClick={() => setScreen('menu')}
          variant="ghost"
          className="absolute top-4 left-4 text-emerald-200"
        >
          <ChevronLeft className="h-5 w-5" /> Back
        </Button>

        <h2 className="text-3xl font-bold text-white mb-4">SELECT HERO</h2>

        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setGender('male')}
            variant={gender === 'male' ? 'default' : 'outline'}
            className={gender === 'male' ? 'bg-emerald-600' : 'border-emerald-500 text-emerald-200'}
          >
            Male
          </Button>
          <Button
            onClick={() => setGender('female')}
            variant={gender === 'female' ? 'default' : 'outline'}
            className={gender === 'female' ? 'bg-emerald-600' : 'border-emerald-500 text-emerald-200'}
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
                    ? 'bg-emerald-600 border-emerald-400 scale-105'
                    : isUnlocked
                    ? 'bg-emerald-800/50 border-emerald-600/50 hover:border-emerald-400'
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
                    <div className="flex justify-between text-xs text-emerald-300">
                      <span>SPD</span>
                      <div className="w-16 bg-emerald-900 rounded-full h-1.5">
                        <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${hero.stats.speed * 10}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-300">
                      <span>PWR</span>
                      <div className="w-16 bg-emerald-900 rounded-full h-1.5">
                        <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${hero.stats.power * 10}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-300">
                      <span>SMH</span>
                      <div className="w-16 bg-emerald-900 rounded-full h-1.5">
                        <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${hero.stats.smash * 10}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Court Select Screen
  const CourtSelectScreen = () => (
    <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-6">
      <Button
        onClick={() => setScreen('menu')}
        variant="ghost"
        className="absolute top-4 left-4 text-emerald-200"
      >
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-6">SELECT COURT</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {COURTS.map(court => {
          const isUnlocked = progress.currentLevel >= court.unlockLevel;
          const isSelected = selectedCourt?.id === court.id;

          return (
            <Card
              key={court.id}
              onClick={() => isUnlocked && setSelectedCourt(court)}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-400 scale-105'
                  : isUnlocked
                  ? 'border-emerald-600/50 hover:border-emerald-400'
                  : 'border-gray-600/50 opacity-50'
              }`}
              style={{
                background: isUnlocked
                  ? `linear-gradient(135deg, ${court.bgColors[0]}, ${court.bgColors[1]})`
                  : '#1f2937',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white">{court.name}</h3>
                {!isUnlocked && <Lock className="h-4 w-4 text-gray-400" />}
                {isUnlocked && progress.completedLevels.includes(court.id) && (
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                )}
              </div>
              <p className="text-xs text-white/70">{court.description}</p>
              {!isUnlocked && (
                <p className="text-xs text-gray-400 mt-2">Unlock at level {court.unlockLevel}</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );

  // Settings Screen
  const SettingsScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <Button
        onClick={() => setScreen('menu')}
        variant="ghost"
        className="absolute top-4 left-4 text-emerald-200"
      >
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">SETTINGS</h2>

      <div className="space-y-6 w-full max-w-xs">
        <div className="flex items-center justify-between p-4 bg-emerald-800/30 rounded-lg">
          <span className="text-white font-medium">Sound</span>
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="icon"
            className="text-emerald-200"
          >
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
        </div>

        <div className="p-4 bg-emerald-800/30 rounded-lg">
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
                className={progress.difficulty === diff ? 'bg-emerald-600' : 'border-emerald-500 text-emerald-200'}
                size="sm"
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => {
            storage.clearProgress();
            setProgress(storage.loadProgress());
          }}
          variant="destructive"
          className="w-full"
        >
          Reset Progress
        </Button>
      </div>
    </div>
  );

  // Match End Screen
  const MatchEndScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">{matchResult?.won ? '🏆' : '😢'}</div>
        <h2 className="text-4xl font-black text-white mb-2">
          {matchResult?.won ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-emerald-200 text-xl mb-6">
          {matchResult?.playerScore} - {matchResult?.opponentScore}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8 text-center">
          <div className="bg-emerald-800/30 p-4 rounded-lg">
            <p className="text-emerald-300 text-sm">Smashes</p>
            <p className="text-2xl font-bold text-white">{matchResult?.smashes}</p>
          </div>
          <div className="bg-emerald-800/30 p-4 rounded-lg">
            <p className="text-emerald-300 text-sm">Coins Earned</p>
            <p className="text-2xl font-bold text-yellow-400">+{matchResult?.coinsEarned}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={() => setScreen('menu')}
            variant="outline"
            className="border-emerald-400 text-emerald-100"
          >
            Menu
          </Button>
          <Button
            onClick={initGame}
            className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold"
          >
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );

  // Pause Overlay
  const PausedOverlay = () => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-6">PAUSED</h2>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => { setIsPaused(false); if (gameStateRef.current) gameStateRef.current.isPaused = false; }}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            <Play className="mr-2 h-5 w-5" /> Resume
          </Button>
          <Button
            onClick={() => setScreen('menu')}
            variant="outline"
            className="border-emerald-400 text-emerald-100"
          >
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
      {screen === 'courtSelect' && <CourtSelectScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'matchEnd' && <MatchEndScreen />}
      
      {screen === 'playing' && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2 px-2">
            <Button
              onClick={() => { setIsPaused(true); if (gameStateRef.current) gameStateRef.current.isPaused = true; }}
              variant="ghost"
              size="icon"
              className="text-emerald-200"
            >
              <Pause className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-emerald-200">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>{progress.coins}</span>
            </div>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              size="icon"
              className="text-emerald-200"
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full rounded-xl border-2 border-emerald-600/50 shadow-2xl cursor-none"
          />
          
          {isPaused && <PausedOverlay />}
        </div>
      )}
    </div>
  );
}
