import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Play, Pause, Volume2, VolumeX, Trophy, Settings, 
  ChevronLeft, Star, Lock, Zap, Users, Target
} from 'lucide-react';
import { GameState, GameScreen, GameMode, Hero, Court, Particle, PowerUp, GameProgress } from './types';
import { COURTS, getCourtById, getUnlockedCourts, getAIDifficulty } from './courts';
import { HEROES, getHeroById, getUnlockedHeroes, getHeroesByGender } from './heroes';
import { storage } from './storage';
import { pickleballAudio } from './audio';
import { POWER_UP_CONFIGS, getPowerUpConfig } from './powerups';
import { 
  renderCourt, renderPlayer, renderBall, renderPowerUp, 
  renderParticles, renderHitIndicator, renderScore, renderTimingBar 
} from './renderer';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const createInitialPlayer = (hero: Hero, isPlayer: boolean) => ({
  x: isPlayer ? 110 : CANVAS_WIDTH - 150,
  y: CANVAS_HEIGHT / 2 - 30,
  width: 40,
  height: 60,
  speed: hero.stats.speed,
  power: hero.stats.power,
  timing: hero.stats.timing,
  dink: hero.stats.dink,
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
  radius: 10,
  spin: 0,
  speed: 0,
  visible: false,
  trajectory: [],
});

export default function PickleballChampionGame() {
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

  useEffect(() => {
    const hero = getHeroById(progress.selectedHero);
    if (hero) setSelectedHero(hero);
    const courts = getUnlockedCourts(progress.currentLevel);
    if (courts.length > 0) setSelectedCourt(courts[0]);
  }, []);

  useEffect(() => {
    pickleballAudio.setEnabled(soundEnabled);
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
  }, [selectedHero, selectedCourt, gameMode]);

  const startServe = (server: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    gs.serving = server;
    gs.ball.visible = true;
    
    if (server === 'player') {
      gs.ball.x = gs.player.x + gs.player.width + 20;
      gs.ball.y = gs.player.y + gs.player.height / 2;
      gs.ball.vx = 5;
      gs.ball.vy = -1.5 + Math.random() * 3;
    } else {
      gs.ball.x = gs.opponent.x - 20;
      gs.ball.y = gs.opponent.y + gs.opponent.height / 2;
      gs.ball.vx = -5;
      gs.ball.vy = -1.5 + Math.random() * 3;
    }
    
    gs.ball.speed = Math.sqrt(gs.ball.vx ** 2 + gs.ball.vy ** 2);
    gs.hitWindow = { start: Date.now(), end: Date.now() + 1500 };
    
    pickleballAudio.playHit();
  };

  const handleInput = useCallback((clientY: number) => {
    if (!gameStateRef.current || gameStateRef.current.isPaused) return;
    
    const gs = gameStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT;

    gs.player.y = Math.max(50, Math.min(CANVAS_HEIGHT - gs.player.height - 50, y - gs.player.height / 2));

    if (gs.hitWindow && gs.ball.visible) {
      const hitZone = {
        x: gs.player.x + gs.player.width,
        y: gs.player.y,
        width: 55,
        height: gs.player.height + 18,
      };

      if (
        gs.ball.x > hitZone.x - 18 &&
        gs.ball.x < hitZone.x + hitZone.width &&
        gs.ball.y > hitZone.y - 10 &&
        gs.ball.y < hitZone.y + hitZone.height + 10
      ) {
        const now = Date.now();
        const windowDuration = gs.hitWindow.end - gs.hitWindow.start;
        const progressTime = (now - gs.hitWindow.start) / windowDuration;
        
        let quality: 'perfect' | 'good' | 'early' | 'late' | 'miss';
        let powerMultiplier = 1;
        
        if (progressTime >= 0.4 && progressTime <= 0.6) {
          quality = 'perfect';
          powerMultiplier = 1.4;
          pickleballAudio.playDink();
          addParticles(gs.ball.x, gs.ball.y, 'spark', 14);
        } else if (progressTime >= 0.25 && progressTime <= 0.75) {
          quality = 'good';
          powerMultiplier = 1.2;
          pickleballAudio.playHit();
          addParticles(gs.ball.x, gs.ball.y, 'bounce', 7);
        } else if (progressTime < 0.25) {
          quality = 'early';
          powerMultiplier = 0.85;
          pickleballAudio.playHit();
        } else {
          quality = 'late';
          powerMultiplier = 0.85;
          pickleballAudio.playHit();
        }

        gs.lastHitQuality = quality;
        setLastHitQuality(quality);
        setTimeout(() => setLastHitQuality(null), 750);

        const hasPowerShot = gs.activePowerUps.some(p => p.type === 'power_shot');
        if (hasPowerShot) powerMultiplier *= 1.25;

        const baseSpeed = 6 + gs.player.power * 0.4;
        const speed = baseSpeed * powerMultiplier;
        const angle = (y - gs.ball.y) * 0.018;
        
        gs.ball.vx = speed;
        gs.ball.vy = angle * speed * 0.45;
        gs.ball.speed = speed;
        gs.ball.spin = (Math.random() - 0.5) * 1.5;
        
        gs.hitWindow = null;
        gs.rallyCount++;
      }
    }
  }, []);

  const addParticles = (x: number, y: number, type: Particle['type'], count: number) => {
    const colors = type === 'spark' 
      ? ['#22c55e', '#16a34a', '#ffffff']
      : type === 'bounce'
      ? ['#facc15', '#fbbf24']
      : ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'];

    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 1,
        maxLife: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
        type,
      });
    }
  };

  const scorePoint = (scorer: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    // Pickleball: Only serving team can score
    if (scorer === 'player' && gs.serving === 'player') {
      gs.playerScore[0]++;
      pickleballAudio.playPoint();
      addParticles(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'confetti', 20);
    } else if (scorer === 'opponent' && gs.serving === 'opponent') {
      gs.opponentScore[0]++;
      pickleballAudio.playMiss();
    } else {
      // Side out - switch serve
      gs.serving = gs.serving === 'player' ? 'opponent' : 'player';
    }

    setDisplayScore({
      player: [...gs.playerScore] as [number, number],
      opponent: [...gs.opponentScore] as [number, number],
    });

    // Win at 11, win by 2
    const playerPts = gs.playerScore[0];
    const opponentPts = gs.opponentScore[0];
    
    if ((playerPts >= 11 || opponentPts >= 11) && Math.abs(playerPts - opponentPts) >= 2) {
      endMatch(playerPts > opponentPts);
      return;
    }

    gs.ball.visible = false;
    setTimeout(() => startServe(gs.serving), 900);
  };

  const endMatch = (playerWon: boolean) => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    const coinsEarned = playerWon ? 45 + gs.rallyCount * 2 : 10;
    const result = {
      won: playerWon,
      playerScore: gs.playerScore[0],
      opponentScore: gs.opponentScore[0],
      dinks: gs.rallyCount,
      accuracy: 0.76,
      avgReactionTime: 340,
      coinsEarned,
      powerUpsUsed: 0,
    };

    setMatchResult(result);

    const newProgress = { ...progress };
    newProgress.coins += coinsEarned;
    newProgress.totalMatches++;
    if (playerWon) {
      newProgress.totalWins++;
      newProgress.totalDinks += gs.rallyCount;
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

    if (playerWon) pickleballAudio.playWin();

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
          
          // Pickleball has less bounce/spin than other racket sports
          gs.ball.vy += 0.12 * timeScale;
          
          gs.ball.x += gs.ball.vx * timeScale;
          gs.ball.y += gs.ball.vy * timeScale;

          // Boundaries
          if (gs.ball.y < 50 || gs.ball.y > CANVAS_HEIGHT - 50) {
            gs.ball.vy *= -0.75;
            gs.ball.y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, gs.ball.y));
            pickleballAudio.playBounce();
          }

          // Net
          if (Math.abs(gs.ball.x - CANVAS_WIDTH / 2) < 6) {
            if (Math.abs(gs.ball.vy) < 2) {
              gs.ball.vx *= -0.3;
              pickleballAudio.playNet();
            }
          }

          // Scoring
          if (gs.ball.x < 45) {
            scorePoint('opponent');
          } else if (gs.ball.x > CANVAS_WIDTH - 45) {
            scorePoint('player');
          }

          // AI
          const aiDiff = getAIDifficulty(gs.currentCourt);
          const targetY = gs.ball.y - gs.opponent.height / 2;
          const aiSpeed = 3.5 + aiDiff.accuracy * 4;
          
          if (Math.abs(gs.opponent.y - targetY) > 5) {
            gs.opponent.y += (targetY - gs.opponent.y) * 0.075 * aiSpeed / 3.5;
          }
          gs.opponent.y = Math.max(50, Math.min(CANVAS_HEIGHT - gs.opponent.height - 50, gs.opponent.y));

          // AI hit
          if (
            gs.ball.vx < 0 &&
            gs.ball.x < gs.opponent.x + 28 &&
            gs.ball.x > gs.opponent.x - 18 &&
            gs.ball.y > gs.opponent.y - 10 &&
            gs.ball.y < gs.opponent.y + gs.opponent.height + 10
          ) {
            const hitChance = 0.72 + aiDiff.accuracy * 0.25;
            if (Math.random() < hitChance) {
              const speed = 5 + aiDiff.ballSpeed * 0.8 + Math.random() * 1.5;
              
              gs.ball.vx = -speed;
              gs.ball.vy = (Math.random() - 0.5) * 3.5;
              gs.ball.spin = (Math.random() - 0.5) * 1.2;
              
              pickleballAudio.playHit();
              addParticles(gs.ball.x, gs.ball.y, 'bounce', 5);
              
              gs.hitWindow = { start: Date.now(), end: Date.now() + aiDiff.hitWindow };
            }
          }
        }

        // Particles
        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.18;
          p.life -= 0.022;
          return p.life > 0;
        });

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

  // UI Components
  const MenuScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-lime-900 via-green-800 to-emerald-900 rounded-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
          🥒 PICKLEBALL CHAMPION
        </h1>
        <p className="text-lime-200 text-lg">Master the Kitchen</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          onClick={() => setScreen('modeSelect')}
          className="h-14 text-lg bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-white font-bold"
        >
          <Play className="mr-2 h-6 w-6" /> PLAY NOW
        </Button>

        <Button onClick={() => setScreen('heroSelect')} variant="outline" className="h-12 border-lime-400 text-lime-100 hover:bg-lime-800/50">
          <Users className="mr-2 h-5 w-5" /> Select Player
        </Button>

        <Button onClick={() => setScreen('courtSelect')} variant="outline" className="h-12 border-lime-400 text-lime-100 hover:bg-lime-800/50">
          <Target className="mr-2 h-5 w-5" /> Select Court
        </Button>

        <Button onClick={() => setScreen('settings')} variant="ghost" className="h-12 text-lime-200 hover:bg-lime-800/30">
          <Settings className="mr-2 h-5 w-5" /> Settings
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-6 text-lime-200">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span>{progress.totalWins} Wins</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-lime-400" />
          <span>{progress.coins} Coins</span>
        </div>
      </div>
    </div>
  );

  const ModeSelectScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-lime-900 via-green-800 to-emerald-900 rounded-xl p-8">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-lime-200">
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">SELECT MODE</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {[
          { mode: 'career' as GameMode, icon: '🏆', title: 'Career', desc: 'Tournament journey' },
          { mode: 'quickMatch' as GameMode, icon: '⚡', title: 'Quick Match', desc: 'Jump right in' },
          { mode: 'practice' as GameMode, icon: '🎯', title: 'Practice', desc: 'Perfect your dinks' },
          { mode: 'challenge' as GameMode, icon: '🔥', title: 'Challenge', desc: 'Test your skills' },
        ].map(({ mode, icon, title, desc }) => (
          <Card
            key={mode}
            onClick={() => { setGameMode(mode); initGame(); }}
            className="p-6 bg-gradient-to-br from-lime-800/50 to-green-900/50 border-lime-600/50 hover:border-lime-400 cursor-pointer transition-all hover:scale-105"
          >
            <div className="text-4xl mb-2">{icon}</div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-lime-300">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const HeroSelectScreen = () => {
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const heroes = getHeroesByGender(gender);

    return (
      <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-lime-900 via-green-800 to-emerald-900 rounded-xl p-6">
        <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-lime-200">
          <ChevronLeft className="h-5 w-5" /> Back
        </Button>

        <h2 className="text-3xl font-bold text-white mb-4">SELECT PLAYER</h2>

        <div className="flex gap-2 mb-6">
          {(['male', 'female'] as const).map(g => (
            <Button
              key={g}
              onClick={() => setGender(g)}
              variant={gender === g ? 'default' : 'outline'}
              className={gender === g ? 'bg-lime-600' : 'border-lime-500 text-lime-200'}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Button>
          ))}
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
                  isSelected ? 'bg-lime-600 border-lime-400 scale-105' : isUnlocked ? 'bg-lime-800/50 border-lime-600/50 hover:border-lime-400' : 'bg-gray-800/50 border-gray-600/50'
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
                    <StatBar label="SPD" value={hero.stats.speed} color="bg-lime-400" />
                    <StatBar label="PWR" value={hero.stats.power} color="bg-green-400" />
                    <StatBar label="DNK" value={hero.stats.dink} color="bg-yellow-400" />
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
    <div className="flex justify-between text-xs text-lime-300">
      <span>{label}</span>
      <div className="w-16 bg-lime-900 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );

  const CourtSelectScreen = () => (
    <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-lime-900 via-green-800 to-emerald-900 rounded-xl p-6">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-lime-200">
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
                isSelected ? 'border-lime-400 scale-105' : isUnlocked ? 'border-lime-600/50 hover:border-lime-400' : 'border-gray-600/50 opacity-50'
              }`}
              style={{
                background: isUnlocked ? `linear-gradient(135deg, ${court.bgColors[0]}, ${court.bgColors[1]})` : '#1f2937',
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
            </Card>
          );
        })}
      </div>
    </div>
  );

  const SettingsScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-lime-900 via-green-800 to-emerald-900 rounded-xl p-8">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-lime-200">
        <ChevronLeft className="h-5 w-5" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">SETTINGS</h2>

      <div className="space-y-6 w-full max-w-xs">
        <div className="flex items-center justify-between p-4 bg-lime-800/30 rounded-lg">
          <span className="text-white font-medium">Sound</span>
          <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="icon" className="text-lime-200">
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
        </div>

        <div className="p-4 bg-lime-800/30 rounded-lg">
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
                className={progress.difficulty === diff ? 'bg-lime-600' : 'border-lime-500 text-lime-200'}
                size="sm"
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <Button onClick={() => { storage.clearProgress(); setProgress(storage.loadProgress()); }} variant="destructive" className="w-full">
          Reset Progress
        </Button>
      </div>
    </div>
  );

  const MatchEndScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-lime-900 via-green-800 to-emerald-900 rounded-xl p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">{matchResult?.won ? '🏆' : '😢'}</div>
        <h2 className="text-4xl font-black text-white mb-2">{matchResult?.won ? 'VICTORY!' : 'DEFEAT'}</h2>
        <p className="text-lime-200 text-xl mb-6">{matchResult?.playerScore} - {matchResult?.opponentScore}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-lime-800/30 p-4 rounded-lg">
            <p className="text-lime-300 text-sm">Dinks</p>
            <p className="text-2xl font-bold text-white">{matchResult?.dinks}</p>
          </div>
          <div className="bg-lime-800/30 p-4 rounded-lg">
            <p className="text-lime-300 text-sm">Coins Earned</p>
            <p className="text-2xl font-bold text-yellow-400">+{matchResult?.coinsEarned}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => setScreen('menu')} variant="outline" className="border-lime-400 text-lime-100">
            Menu
          </Button>
          <Button onClick={initGame} className="bg-gradient-to-r from-lime-500 to-green-500 text-white font-bold">
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
            className="bg-lime-600 hover:bg-lime-500"
          >
            <Play className="mr-2 h-5 w-5" /> Resume
          </Button>
          <Button onClick={() => setScreen('menu')} variant="outline" className="border-lime-400 text-lime-100">
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
              variant="ghost" size="icon" className="text-lime-200"
            >
              <Pause className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-lime-200">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>{progress.coins}</span>
            </div>
            <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="icon" className="text-lime-200">
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full rounded-xl border-2 border-lime-600/50 shadow-2xl cursor-none"
          />
          
          {isPaused && <PausedOverlay />}
        </div>
      )}
    </div>
  );
}
