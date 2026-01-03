import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Play, Pause, Volume2, VolumeX, Trophy, Settings, 
  ChevronLeft, Star, Lock, Zap, Users, Target
} from 'lucide-react';
import { GameState, GameScreen, GameMode, Hero, Court, Particle, PowerUp, GameProgress } from './types';
import { COURTS, getCourtById, getUnlockedCourts, getAIDifficulty } from './courts';
import { HEROES, getHeroById, getUnlockedHeroes } from './heroes';
import { storage } from './storage';
import { badmintonAudio } from './audio';
import { POWER_UP_CONFIGS } from './powerups';
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
  trajectory: [] as { x: number; y: number }[],
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

  useEffect(() => {
    const hero = getHeroById(progress.selectedHero);
    if (hero) setSelectedHero(hero);
    const courts = getUnlockedCourts(progress.currentLevel);
    if (courts.length > 0) setSelectedCourt(courts[0]);
  }, []);

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

    gs.player.y = Math.max(40, Math.min(CANVAS_HEIGHT - gs.player.height - 40, y - gs.player.height / 2));

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
        const hitProgress = (now - gs.hitWindow.start) / windowDuration;
        
        let quality: 'perfect' | 'good' | 'early' | 'late' | 'miss';
        let powerMultiplier = 1;
        
        if (hitProgress >= 0.4 && hitProgress <= 0.6) {
          quality = 'perfect';
          powerMultiplier = 1.5;
          badmintonAudio.playSmash();
          addParticles(gs.shuttlecock.x, gs.shuttlecock.y, 'spark', 15);
        } else if (hitProgress >= 0.25 && hitProgress <= 0.75) {
          quality = 'good';
          powerMultiplier = 1.2;
          badmintonAudio.playHit();
          addParticles(gs.shuttlecock.x, gs.shuttlecock.y, 'feather', 8);
        } else if (hitProgress < 0.25) {
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

        const hasPowerSmash = gs.activePowerUps.some(p => p.type === 'power_smash');
        if (hasPowerSmash || quality === 'perfect') {
          gs.shuttlecock.isSmash = true;
          powerMultiplier *= 1.3;
        }

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
        x, y,
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

    const playerPts = gs.playerScore[0];
    const opponentPts = gs.opponentScore[0];
    
    if ((playerPts >= 21 || opponentPts >= 21) && Math.abs(playerPts - opponentPts) >= 2) {
      endMatch(playerPts > opponentPts);
      return;
    }

    if (playerPts >= 30 || opponentPts >= 30) {
      endMatch(playerPts > opponentPts);
      return;
    }

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

    if (playerWon) badmintonAudio.playWin();

    setScreen('matchEnd');
  };

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

        if (gs.shuttlecock.visible) {
          const timeScale = gs.slowMotionActive ? 0.3 : 1;
          
          const drag = 0.98;
          gs.shuttlecock.vx *= drag;
          gs.shuttlecock.vy *= drag;
          
          gs.shuttlecock.vy += 0.15 * timeScale;
          
          gs.shuttlecock.x += gs.shuttlecock.vx * timeScale;
          gs.shuttlecock.y += gs.shuttlecock.vy * timeScale;

          if (gs.shuttlecock.y < 50 || gs.shuttlecock.y > CANVAS_HEIGHT - 50) {
            gs.shuttlecock.vy *= -0.7;
            gs.shuttlecock.y = Math.max(50, Math.min(CANVAS_HEIGHT - 50, gs.shuttlecock.y));
          }

          if (gs.shuttlecock.x < 40) {
            scorePoint('opponent');
          } else if (gs.shuttlecock.x > CANVAS_WIDTH - 40) {
            scorePoint('player');
          }

          const aiDiff = getAIDifficulty(gs.currentCourt);
          const targetY = gs.shuttlecock.y - gs.opponent.height / 2;
          const aiSpeed = 3 + aiDiff.accuracy * 5;
          
          if (Math.abs(gs.opponent.y - targetY) > 5) {
            gs.opponent.y += (targetY - gs.opponent.y) * 0.08 * aiSpeed / 3;
          }

          if (
            gs.shuttlecock.vx < 0 &&
            gs.shuttlecock.x < gs.opponent.x + 30 &&
            gs.shuttlecock.x > gs.opponent.x - 20 &&
            gs.shuttlecock.y > gs.opponent.y - 10 &&
            gs.shuttlecock.y < gs.opponent.y + gs.opponent.height + 10
          ) {
            const hitChance = 0.7 + aiDiff.accuracy * 0.3;
            if (Math.random() < hitChance) {
              const speed = 5 + aiDiff.shuttleSpeed + Math.random() * 2;
              const isSmash = Math.random() < 0.2 + aiDiff.aggression;
              
              gs.shuttlecock.vx = -speed * (isSmash ? 1.3 : 1);
              gs.shuttlecock.vy = (Math.random() - 0.5) * 4;
              gs.shuttlecock.isSmash = isSmash;
              
              badmintonAudio.playHit();
              addParticles(gs.shuttlecock.x, gs.shuttlecock.y, 'feather', 5);
              
              gs.hitWindow = { start: Date.now(), end: Date.now() + aiDiff.hitWindow };
            }
          }
        }

        particlesRef.current = particlesRef.current.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2;
          p.life -= 0.02;
          return p.life > 0;
        });

        if (gs.slowMotionActive && Date.now() > gs.slowMotionStartTime + gs.slowMotionDuration) {
          gs.slowMotionActive = false;
        }
      }

      const court = getCourtById(gs.currentCourt);
      if (court) {
        renderCourt(ctx, court, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      renderPlayer(ctx, gs.player, false, false);
      renderPlayer(ctx, gs.opponent, true, false);
      renderShuttlecock(ctx, gs.shuttlecock);
      
      gs.powerUpsOnCourt.forEach(p => renderPowerUp(ctx, p, Date.now()));
      renderParticles(ctx, particlesRef.current);
      
      if (lastHitQuality) {
        renderHitIndicator(ctx, lastHitQuality as any, 1, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      }
      
      renderScore(ctx, gs.playerScore, gs.opponentScore, gs.serving, CANVAS_WIDTH);
      const timingProgress = gs.hitWindow ? (Date.now() - gs.hitWindow.start) / (gs.hitWindow.end - gs.hitWindow.start) : 0;
      renderTimingBar(ctx, timingProgress, CANVAS_WIDTH, CANVAS_HEIGHT);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [screen, isPaused, lastHitQuality]);

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
          className="h-14 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold"
        >
          <Play className="mr-2 h-6 w-6" /> PLAY NOW
        </Button>

        <Button onClick={() => setScreen('heroSelect')} variant="outline" className="h-12 border-emerald-400 text-emerald-100 hover:bg-emerald-800/50">
          <Users className="mr-2 h-5 w-5" /> Select Player
        </Button>

        <Button onClick={() => setScreen('courtSelect')} variant="outline" className="h-12 border-emerald-400 text-emerald-100 hover:bg-emerald-800/50">
          <Target className="mr-2 h-5 w-5" /> Select Court
        </Button>

        <Button onClick={() => setScreen('settings')} variant="ghost" className="h-12 text-emerald-200 hover:bg-emerald-800/30">
          <Settings className="mr-2 h-5 w-5" /> Settings
        </Button>
      </div>

      <div className="mt-8 flex items-center gap-6 text-emerald-200">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span>Wins: {progress.totalWins}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <span>{progress.coins} coins</span>
        </div>
      </div>
    </div>
  );

  const ModeSelectScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-white">
        <ChevronLeft className="h-6 w-6" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">Select Mode</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {[
          { mode: 'quickMatch' as GameMode, title: 'Quick Match', desc: 'Jump right in!', icon: <Zap className="h-8 w-8" /> },
          { mode: 'career' as GameMode, title: 'Career', desc: 'Progress through courts', icon: <Trophy className="h-8 w-8" /> },
          { mode: 'practice' as GameMode, title: 'Practice', desc: 'No pressure', icon: <Target className="h-8 w-8" /> },
          { mode: 'challenge' as GameMode, title: 'Challenge', desc: 'Test your limits', icon: <Star className="h-8 w-8" /> },
        ].map(({ mode, title, desc, icon }) => (
          <Card
            key={mode}
            onClick={() => { setGameMode(mode); initGame(); }}
            className="p-6 cursor-pointer bg-white/10 border-white/20 hover:bg-white/20 transition-all text-center"
          >
            <div className="text-emerald-300 mb-2 flex justify-center">{icon}</div>
            <h3 className="text-white font-bold text-lg">{title}</h3>
            <p className="text-emerald-200 text-sm">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );

  const HeroSelectScreen = () => (
    <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-6">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-white">
        <ChevronLeft className="h-6 w-6" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-6">Choose Your Player</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {HEROES.map((hero) => {
          const isUnlocked = progress.unlockedHeroes.includes(hero.id);
          const isSelected = selectedHero?.id === hero.id;

          return (
            <Card
              key={hero.id}
              onClick={() => isUnlocked && setSelectedHero(hero)}
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-yellow-400 bg-white/20' : 'bg-white/10 hover:bg-white/15'
              } ${!isUnlocked ? 'opacity-50' : ''}`}
            >
              <div className="text-4xl text-center mb-2">{hero.avatar}</div>
              <h3 className="text-white font-bold text-center text-sm">{hero.name}</h3>
              {!isUnlocked && (
                <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs mt-1">
                  <Lock className="h-3 w-3" /> {hero.unlockCost}
                </div>
              )}
              {isUnlocked && (
                <div className="grid grid-cols-2 gap-1 mt-2 text-xs text-emerald-200">
                  <span>SPD: {hero.stats.speed}</span>
                  <span>PWR: {hero.stats.power}</span>
                  <span>TIM: {hero.stats.timing}</span>
                  <span>SMH: {hero.stats.smash}</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button
        onClick={() => setScreen('menu')}
        className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500"
        disabled={!selectedHero}
      >
        Confirm Selection
      </Button>
    </div>
  );

  const CourtSelectScreen = () => (
    <div className="flex flex-col items-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-6">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-white">
        <ChevronLeft className="h-6 w-6" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-6">Select Court</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {COURTS.map((court) => {
          const isUnlocked = court.unlockLevel <= progress.currentLevel;
          const isSelected = selectedCourt?.id === court.id;

          return (
            <Card
              key={court.id}
              onClick={() => isUnlocked && setSelectedCourt(court)}
              className={`p-4 cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-yellow-400 bg-white/20' : 'bg-white/10 hover:bg-white/15'
              } ${!isUnlocked ? 'opacity-50' : ''}`}
            >
              <div 
                className="h-16 rounded mb-2"
                style={{ background: `linear-gradient(135deg, ${court.bgColors[0]}, ${court.bgColors[1]})` }}
              />
              <h3 className="text-white font-bold text-center text-sm">{court.name}</h3>
              <p className="text-emerald-200 text-xs text-center">{court.type}</p>
              {!isUnlocked && (
                <div className="flex items-center justify-center gap-1 text-yellow-400 text-xs mt-1">
                  <Lock className="h-3 w-3" /> Level {court.unlockLevel}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Button
        onClick={() => setScreen('menu')}
        className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500"
        disabled={!selectedCourt}
      >
        Confirm Selection
      </Button>
    </div>
  );

  const SettingsScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <Button onClick={() => setScreen('menu')} variant="ghost" className="absolute top-4 left-4 text-white">
        <ChevronLeft className="h-6 w-6" /> Back
      </Button>

      <h2 className="text-3xl font-bold text-white mb-8">Settings</h2>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          onClick={() => setSoundEnabled(!soundEnabled)}
          variant="outline"
          className="h-14 border-emerald-400 text-emerald-100"
        >
          {soundEnabled ? <Volume2 className="mr-2 h-5 w-5" /> : <VolumeX className="mr-2 h-5 w-5" />}
          Sound: {soundEnabled ? 'ON' : 'OFF'}
        </Button>

        <Button
          onClick={() => { storage.clearProgress(); setProgress(storage.loadProgress()); }}
          variant="destructive"
          className="h-12"
        >
          Reset Progress
        </Button>
      </div>
    </div>
  );

  const MatchEndScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 rounded-xl p-8">
      <h2 className={`text-4xl font-black mb-4 ${matchResult?.won ? 'text-yellow-400' : 'text-red-400'}`}>
        {matchResult?.won ? '🏆 VICTORY!' : '😔 DEFEAT'}
      </h2>

      <div className="bg-black/30 rounded-xl p-6 mb-6 text-center">
        <div className="text-3xl font-bold text-white mb-4">
          {matchResult?.playerScore} - {matchResult?.opponentScore}
        </div>
        <div className="grid grid-cols-2 gap-4 text-emerald-200">
          <div>Smashes: {matchResult?.smashes}</div>
          <div>Coins: +{matchResult?.coinsEarned}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={initGame} className="bg-gradient-to-r from-emerald-500 to-teal-500">
          <Play className="mr-2 h-5 w-5" /> Play Again
        </Button>
        <Button onClick={() => setScreen('menu')} variant="outline" className="border-emerald-400 text-emerald-100">
          Main Menu
        </Button>
      </div>
    </div>
  );

  const PausedOverlay = () => (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-8">PAUSED</h2>
        <div className="flex flex-col gap-4">
          <Button onClick={() => { setIsPaused(false); if (gameStateRef.current) gameStateRef.current.isPaused = false; }}>
            <Play className="mr-2 h-5 w-5" /> Resume
          </Button>
          <Button onClick={() => setScreen('menu')} variant="outline">
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
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button
              onClick={() => { setIsPaused(true); if (gameStateRef.current) gameStateRef.current.isPaused = true; }}
              size="sm"
              variant="secondary"
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button onClick={() => setSoundEnabled(!soundEnabled)} size="sm" variant="secondary">
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full rounded-xl shadow-2xl cursor-none"
          />

          {isPaused && <PausedOverlay />}
        </div>
      )}
    </div>
  );
}
