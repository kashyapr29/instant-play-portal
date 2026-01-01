import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Play, Pause, Home, Settings, Trophy, Users, User, ChevronLeft, ChevronRight, Volume2, VolumeX, Zap } from 'lucide-react';
import { GameState, GameScreen, GameMode, Player, Ball, PowerUp, Particle, MatchResult } from './types';
import { COURTS, getCourtById, getAIDifficulty } from './courts';
import { HEROES, getHeroById, getHeroesByGender } from './heroes';
import { storage } from './storage';
import { tennisAudio } from './audio';
import { createPowerUp, POWER_UP_CONFIGS } from './powerups';
import {
  renderCourt,
  renderPlayer,
  renderBall,
  renderPowerUp,
  renderParticles,
  renderHitIndicator,
  renderScore,
  renderTimingBar,
} from './renderer';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

const TennisHeroGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  
  const [progress, setProgress] = useState(storage.get());
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('career');
  const [selectedCourt, setSelectedCourt] = useState(1);
  const [genderFilter, setGenderFilter] = useState<'male' | 'female'>('male');
  const [selectedHeroId, setSelectedHeroId] = useState(progress.selectedHero);
  const [isPaused, setIsPaused] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  
  // Game state refs for animation loop
  const gameStateRef = useRef<GameState | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const hitIndicatorRef = useRef<{ quality: 'perfect' | 'good' | 'early' | 'late' | 'miss' | null; alpha: number; x: number; y: number }>({ quality: null, alpha: 0, x: 0, y: 0 });
  const isSwingingRef = useRef(false);
  const matchStatsRef = useRef({ aces: 0, accuracy: 0, hits: 0, attempts: 0, reactionTimes: [] as number[] });
  const lastBallHitTimeRef = useRef(0);
  const powerUpSpawnTimerRef = useRef(0);

  // Audio setup
  useEffect(() => {
    tennisAudio.setEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  const createPlayer = (isOpponent: boolean): Player => {
    const hero = getHeroById(isOpponent ? 'alex' : selectedHeroId);
    const baseY = isOpponent ? 80 : CANVAS_HEIGHT - 150;
    
    return {
      x: CANVAS_WIDTH / 2 - 20,
      y: baseY,
      width: 40,
      height: 60,
      speed: 3 + (hero.stats.speed / 100) * 3,
      power: hero.stats.power,
      timing: hero.stats.timing,
      spin: hero.stats.spin,
      name: hero.name,
      avatar: hero.avatar,
      isServing: !isOpponent,
      score: 0,
      games: 0,
      sets: 0,
    };
  };

  const createBall = (): Ball => ({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 200,
    vx: 0,
    vy: 0,
    radius: 8,
    spin: 0,
    speed: 0,
    visible: true,
    trajectory: [],
  });

  const initGame = useCallback(() => {
    const court = getCourtById(selectedCourt);
    const difficulty = getAIDifficulty(selectedCourt);
    
    gameStateRef.current = {
      screen: 'playing',
      mode: gameMode,
      currentCourt: selectedCourt,
      player: createPlayer(false),
      opponent: createPlayer(true),
      ball: createBall(),
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
    };
    
    particlesRef.current = [];
    matchStatsRef.current = { aces: 0, accuracy: 0, hits: 0, attempts: 0, reactionTimes: [] };
    powerUpSpawnTimerRef.current = 0;
    
    // Start serve
    setTimeout(() => serveBall(), 500);
  }, [selectedCourt, gameMode, selectedHeroId]);

  const serveBall = () => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    const difficulty = getAIDifficulty(gs.currentCourt);
    const isPlayerServing = gs.serving === 'player';
    
    gs.ball.x = isPlayerServing ? gs.player.x + gs.player.width / 2 : gs.opponent.x + gs.opponent.width / 2;
    gs.ball.y = isPlayerServing ? gs.player.y - 20 : gs.opponent.y + gs.opponent.height + 20;
    gs.ball.vx = (Math.random() - 0.5) * 2;
    gs.ball.vy = isPlayerServing ? -difficulty.ballSpeed : difficulty.ballSpeed;
    gs.ball.visible = true;
    gs.ball.speed = difficulty.ballSpeed;
    gs.rallyCount = 0;
    
    tennisAudio.serve();
  };

  const hitBall = (isPerfect: boolean) => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    const difficulty = getAIDifficulty(gs.currentCourt);
    const hero = getHeroById(selectedHeroId);
    
    // Calculate power based on timing and hero stats
    const powerMultiplier = isPerfect ? 1.5 : 1;
    const speedBoost = gs.activePowerUps.some(p => p.type === 'power_smash') ? 1.5 : 1;
    
    gs.ball.vy = -Math.abs(gs.ball.vy) * powerMultiplier * speedBoost;
    gs.ball.vx = (Math.random() - 0.5) * 4 * (hero.stats.spin / 100 + 0.5);
    gs.ball.spin = (hero.stats.spin / 100) * (Math.random() - 0.5);
    gs.rallyCount++;
    
    if (isPerfect) {
      tennisAudio.perfectHit();
      createSparkParticles(gs.ball.x, gs.ball.y);
    } else {
      tennisAudio.hit();
    }
    
    isSwingingRef.current = true;
    setTimeout(() => { isSwingingRef.current = false; }, 150);
  };

  const createSparkParticles = (x: number, y: number) => {
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 30,
        maxLife: 30,
        color: 'rgb(255, 215, 0)',
        size: 4,
        type: 'spark',
      });
    }
  };

  const createDustParticles = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        life: 20,
        maxLife: 20,
        color: 'rgb(200, 180, 160)',
        size: 6,
        type: 'dust',
      });
    }
  };

  const handleInput = useCallback(() => {
    if (!gameStateRef.current || screen !== 'playing' || isPaused) return;
    
    const gs = gameStateRef.current;
    const ball = gs.ball;
    const player = gs.player;
    const now = performance.now();
    
    matchStatsRef.current.attempts++;
    
    // Check if ball is in hit zone
    const hitZoneY = player.y - 50;
    const hitZoneHeight = 80;
    const distanceToPlayer = Math.abs(ball.x - (player.x + player.width / 2));
    const ballInYRange = ball.y > hitZoneY && ball.y < hitZoneY + hitZoneHeight;
    const ballInXRange = distanceToPlayer < player.width * 1.5;
    
    if (ballInYRange && ballInXRange && ball.vy > 0) {
      // Calculate timing quality
      const optimalY = player.y - 20;
      const distanceFromOptimal = Math.abs(ball.y - optimalY);
      const hero = getHeroById(selectedHeroId);
      const timingBonus = hero.stats.timing / 100;
      
      let quality: 'perfect' | 'good' | 'early' | 'late' | 'miss';
      
      if (distanceFromOptimal < 15 + timingBonus * 10) {
        quality = 'perfect';
        hitBall(true);
        matchStatsRef.current.hits++;
      } else if (distanceFromOptimal < 30 + timingBonus * 15) {
        quality = ball.y < optimalY ? 'early' : 'late';
        hitBall(false);
        matchStatsRef.current.hits++;
      } else {
        quality = 'miss';
        tennisAudio.miss();
      }
      
      hitIndicatorRef.current = { quality, alpha: 1, x: ball.x, y: ball.y - 30 };
      gs.lastHitQuality = quality;
      
      // Track reaction time
      if (lastBallHitTimeRef.current > 0) {
        matchStatsRef.current.reactionTimes.push(now - lastBallHitTimeRef.current);
      }
      lastBallHitTimeRef.current = now;
    }
  }, [screen, isPaused, selectedHeroId]);

  const scorePoint = (scorer: 'player' | 'opponent') => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    
    if (scorer === 'player') {
      gs.playerScore[1]++;
      tennisAudio.point();
      
      // Check for ace
      if (gs.rallyCount === 0 && gs.serving === 'player') {
        matchStatsRef.current.aces++;
        tennisAudio.ace();
      }
    } else {
      gs.opponentScore[1]++;
    }
    
    // Check for game win (simplified tennis scoring)
    const playerPts = gs.playerScore[1];
    const opponentPts = gs.opponentScore[1];
    
    if (playerPts >= 4 && playerPts - opponentPts >= 2) {
      gs.playerScore[0]++;
      gs.playerScore[1] = 0;
      gs.opponentScore[1] = 0;
      gs.serving = gs.serving === 'player' ? 'opponent' : 'player';
      tennisAudio.gameWon();
    } else if (opponentPts >= 4 && opponentPts - playerPts >= 2) {
      gs.opponentScore[0]++;
      gs.playerScore[1] = 0;
      gs.opponentScore[1] = 0;
      gs.serving = gs.serving === 'player' ? 'opponent' : 'player';
    }
    
    // Check for match end (first to 6 games)
    if (gs.playerScore[0] >= 6 && gs.playerScore[0] - gs.opponentScore[0] >= 2) {
      endMatch(true);
      return;
    } else if (gs.opponentScore[0] >= 6 && gs.opponentScore[0] - gs.playerScore[0] >= 2) {
      endMatch(false);
      return;
    }
    
    // Serve again after delay
    setTimeout(() => serveBall(), 1500);
  };

  const endMatch = (won: boolean) => {
    const gs = gameStateRef.current;
    if (!gs) return;
    
    const stats = matchStatsRef.current;
    const accuracy = stats.attempts > 0 ? (stats.hits / stats.attempts) * 100 : 0;
    const avgReaction = stats.reactionTimes.length > 0 
      ? stats.reactionTimes.reduce((a, b) => a + b, 0) / stats.reactionTimes.length 
      : 0;
    
    const coinsEarned = won ? 100 + gs.currentCourt * 50 + stats.aces * 20 : 20;
    
    const result: MatchResult = {
      won,
      playerScore: gs.playerScore[0],
      opponentScore: gs.opponentScore[0],
      aces: stats.aces,
      accuracy: Math.round(accuracy),
      avgReactionTime: Math.round(avgReaction),
      coinsEarned,
      powerUpsUsed: gs.activePowerUps.length,
    };
    
    setMatchResult(result);
    setScreen('matchEnd');
    
    // Update progress
    let newProgress = storage.addCoins(coinsEarned);
    newProgress = storage.recordMatch(won, stats.aces);
    if (won && gameMode === 'career') {
      newProgress = storage.completeLevel(selectedCourt, gs.playerScore[0] * 100);
    }
    setProgress(newProgress);
    
    if (won) {
      tennisAudio.matchWon();
    } else {
      tennisAudio.matchLost();
    }
  };

  // AI opponent logic
  const updateAI = (gs: GameState, deltaTime: number) => {
    const difficulty = getAIDifficulty(gs.currentCourt);
    const opponent = gs.opponent;
    const ball = gs.ball;
    
    // Move towards ball
    if (ball.vy < 0) { // Ball moving towards opponent
      const targetX = ball.x - opponent.width / 2;
      const diff = targetX - opponent.x;
      
      // Add some reaction delay based on difficulty
      if (Math.abs(diff) > 5) {
        const moveSpeed = (4 - difficulty.reactionTime / 200) * (deltaTime / 16);
        opponent.x += Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed);
      }
      
      // Check if ball reached opponent
      const ballNearOpponent = ball.y < opponent.y + opponent.height + 30;
      const ballInRange = Math.abs(ball.x - (opponent.x + opponent.width / 2)) < opponent.width;
      
      if (ballNearOpponent && ballInRange && ball.vy < 0) {
        // AI hits the ball back
        if (Math.random() < difficulty.accuracy) {
          ball.vy = Math.abs(ball.vy);
          ball.vx = (Math.random() - 0.5) * 4;
          gs.rallyCount++;
          tennisAudio.hit();
          createDustParticles(ball.x, ball.y);
        }
      }
    }
    
    // Keep in bounds
    opponent.x = Math.max(40, Math.min(CANVAS_WIDTH - 40 - opponent.width, opponent.x));
  };

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current || !gameStateRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;
    timeRef.current = timestamp;
    
    const gs = gameStateRef.current;
    
    if (!isPaused && screen === 'playing') {
      gs.matchTime += deltaTime;
      
      // Update ball physics
      const slowMotion = gs.activePowerUps.some(p => p.type === 'slow_motion') ? 0.5 : 1;
      gs.ball.x += gs.ball.vx * slowMotion;
      gs.ball.y += gs.ball.vy * slowMotion;
      
      // Apply spin
      gs.ball.vx += gs.ball.spin * 0.1;
      
      // Wall bounces
      if (gs.ball.x < 50 || gs.ball.x > CANVAS_WIDTH - 50) {
        gs.ball.vx *= -0.8;
        gs.ball.x = gs.ball.x < 50 ? 50 : CANVAS_WIDTH - 50;
        tennisAudio.bounce();
      }
      
      // Check for scoring
      if (gs.ball.y > CANVAS_HEIGHT + 20) {
        scorePoint('opponent');
        gs.ball.visible = false;
      } else if (gs.ball.y < -20) {
        scorePoint('player');
        gs.ball.visible = false;
      }
      
      // Update AI
      updateAI(gs, deltaTime);
      
      // Move player towards touch/mouse
      // (handled by separate input)
      
      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life--;
        return p.life > 0;
      });
      
      // Update hit indicator
      if (hitIndicatorRef.current.alpha > 0) {
        hitIndicatorRef.current.alpha -= 0.02;
        hitIndicatorRef.current.y -= 1;
      }
      
      // Spawn power-ups occasionally
      powerUpSpawnTimerRef.current += deltaTime;
      if (powerUpSpawnTimerRef.current > 15000 && gs.powerUpsOnCourt.length < 2) {
        gs.powerUpsOnCourt.push(createPowerUp(CANVAS_WIDTH, CANVAS_HEIGHT));
        powerUpSpawnTimerRef.current = 0;
      }
      
      // Check power-up collection
      gs.powerUpsOnCourt = gs.powerUpsOnCourt.filter(pu => {
        if (!pu.active) return false;
        const dist = Math.hypot(gs.ball.x - pu.x, gs.ball.y - pu.y);
        if (dist < 30) {
          gs.activePowerUps.push({ type: pu.type, endTime: timestamp + pu.duration });
          tennisAudio.powerUp();
          return false;
        }
        return true;
      });
      
      // Expire power-ups
      gs.activePowerUps = gs.activePowerUps.filter(p => p.endTime > timestamp);
    }
    
    // Render
    const court = getCourtById(gs.currentCourt);
    renderCourt(ctx, court, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Render power-ups
    gs.powerUpsOnCourt.forEach(pu => renderPowerUp(ctx, pu, timestamp));
    
    // Render players
    const playerHero = getHeroById(selectedHeroId);
    renderPlayer(ctx, gs.opponent, true, '🎾', false);
    renderPlayer(ctx, gs.player, false, playerHero.avatar, isSwingingRef.current);
    
    // Render ball
    renderBall(ctx, gs.ball, timestamp);
    
    // Render particles
    renderParticles(ctx, particlesRef.current);
    
    // Render hit indicator
    renderHitIndicator(
      ctx,
      hitIndicatorRef.current.quality,
      hitIndicatorRef.current.x,
      hitIndicatorRef.current.y,
      hitIndicatorRef.current.alpha
    );
    
    // Render score
    renderScore(ctx, gs.playerScore, gs.opponentScore, gs.serving, CANVAS_WIDTH);
    
    // Render active power-ups indicator
    if (gs.activePowerUps.length > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(10, 70, 100, 30 * gs.activePowerUps.length);
      gs.activePowerUps.forEach((pu, i) => {
        const config = POWER_UP_CONFIGS[pu.type];
        ctx.font = '14px Arial';
        ctx.fillStyle = config.color;
        ctx.fillText(`${config.icon} ${config.name}`, 20, 90 + i * 30);
      });
    }
    
    // Timing hint
    if (gs.ball.vy > 0 && gs.ball.y > CANVAS_HEIGHT * 0.5 && gs.ball.y < CANVAS_HEIGHT * 0.8) {
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Tap when near!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, screen, selectedHeroId]);

  // Handle player movement (touch/mouse)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current || screen !== 'playing' || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    
    const speedBoost = gameStateRef.current.activePowerUps.some(p => p.type === 'speed_boost') ? 1.5 : 1;
    const targetX = x - gameStateRef.current.player.width / 2;
    const diff = targetX - gameStateRef.current.player.x;
    
    gameStateRef.current.player.x += diff * 0.2 * speedBoost;
    gameStateRef.current.player.x = Math.max(40, Math.min(CANVAS_WIDTH - 40 - gameStateRef.current.player.width, gameStateRef.current.player.x));
  }, [screen, isPaused]);

  // Start/stop game loop
  useEffect(() => {
    if (screen === 'playing') {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [screen, gameLoop]);

  // Key/touch handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && screen === 'playing') {
        e.preventDefault();
        handleInput();
      } else if (e.code === 'Escape' && screen === 'playing') {
        setIsPaused(p => !p);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleInput]);

  const startGame = () => {
    initGame();
    setScreen('playing');
    setIsPaused(false);
    setMatchResult(null);
  };

  const toggleSound = () => {
    const newProgress = storage.toggleSound();
    setProgress(newProgress);
    tennisAudio.setEnabled(newProgress.soundEnabled);
    tennisAudio.click();
  };

  // Render different screens
  const renderMenuScreen = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-green-600 via-green-700 to-green-800 text-white p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-yellow-300 opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-yellow-400 opacity-10" />
        <div className="absolute top-1/3 right-1/4 text-6xl opacity-20">🎾</div>
      </div>
      
      {/* Title */}
      <div className="relative z-10 text-center mb-8">
        <h1 className="text-5xl font-bold mb-2 text-yellow-300 drop-shadow-lg" style={{ textShadow: '3px 3px 0 #166534' }}>
          🎾 Tennis Hero
        </h1>
        <p className="text-green-200 text-lg">Become a Champion!</p>
      </div>
      
      {/* Animated player */}
      <div className="text-8xl mb-8 animate-bounce">🏃</div>
      
      {/* Menu buttons */}
      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs">
        <Button
          onClick={() => setScreen('modeSelect')}
          className="h-14 text-xl bg-yellow-500 hover:bg-yellow-400 text-green-900 font-bold rounded-full shadow-lg transform hover:scale-105 transition-all"
        >
          <Play className="mr-2 h-6 w-6" /> Play Now
        </Button>
        
        <Button
          onClick={() => setScreen('heroSelect')}
          className="h-12 text-lg bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-full shadow-lg transform hover:scale-105 transition-all"
        >
          <Users className="mr-2 h-5 w-5" /> Select Hero
        </Button>
        
        <Button
          onClick={() => setScreen('settings')}
          variant="outline"
          className="h-12 text-lg border-2 border-white text-white hover:bg-white/20 rounded-full"
        >
          <Settings className="mr-2 h-5 w-5" /> Settings
        </Button>
      </div>
      
      {/* Stats bar */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-yellow-300">💰</span>
          <span>{progress.coins}</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-300" />
          <span>{progress.totalWins} Wins</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-300" />
          <span>Level {progress.highestLevel}</span>
        </div>
      </div>
    </div>
  );

  const renderModeSelect = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-indigo-600 to-purple-800 text-white p-4">
      <Button
        onClick={() => setScreen('menu')}
        variant="ghost"
        className="absolute top-4 left-4 text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <h2 className="text-3xl font-bold mb-8">Select Mode</h2>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {[
          { mode: 'career' as GameMode, name: 'Career', icon: '🏆', desc: 'Progress through courts', color: 'from-yellow-500 to-orange-500' },
          { mode: 'quickMatch' as GameMode, name: 'Quick Match', icon: '⚡', desc: 'Jump into action', color: 'from-blue-500 to-cyan-500' },
          { mode: 'practice' as GameMode, name: 'Practice', icon: '🎯', desc: 'Train your skills', color: 'from-green-500 to-emerald-500' },
          { mode: 'challenge' as GameMode, name: 'Challenge', icon: '🔥', desc: 'Daily challenges', color: 'from-red-500 to-pink-500' },
        ].map(m => (
          <button
            key={m.mode}
            onClick={() => {
              setGameMode(m.mode);
              setScreen('courtSelect');
              tennisAudio.click();
            }}
            className={`p-4 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-lg transform hover:scale-105 transition-all`}
          >
            <div className="text-3xl mb-2">{m.icon}</div>
            <div className="font-bold">{m.name}</div>
            <div className="text-xs opacity-80">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCourtSelect = () => (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 overflow-auto">
      <Button
        onClick={() => setScreen('modeSelect')}
        variant="ghost"
        className="absolute top-4 left-4 text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <h2 className="text-2xl font-bold mb-4 mt-8">Select Court</h2>
      
      <div className="flex flex-col gap-3 w-full max-w-sm pb-4">
        {COURTS.map(court => {
          const unlocked = court.unlockLevel <= progress.highestLevel;
          return (
            <button
              key={court.id}
              onClick={() => {
                if (unlocked) {
                  setSelectedCourt(court.id);
                  startGame();
                  tennisAudio.click();
                }
              }}
              disabled={!unlocked}
              className={`relative p-4 rounded-xl text-left transition-all ${
                unlocked 
                  ? 'bg-gradient-to-r shadow-lg transform hover:scale-102'
                  : 'bg-gray-700 opacity-50'
              }`}
              style={unlocked ? { background: `linear-gradient(135deg, ${court.bgColors[0]}, ${court.bgColors[1] || court.bgColors[0]})` } : {}}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">{court.name}</div>
                  <div className="text-sm opacity-80">{court.description}</div>
                  <div className="text-xs mt-1 opacity-60">{court.surface.toUpperCase()}</div>
                </div>
                {!unlocked && (
                  <div className="text-2xl">🔒</div>
                )}
                {unlocked && progress.completedLevels.includes(court.id) && (
                  <div className="text-2xl">⭐</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderHeroSelect = () => {
    const heroes = getHeroesByGender(genderFilter);
    
    return (
      <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-b from-blue-800 to-indigo-900 text-white p-4 overflow-auto">
        <Button
          onClick={() => setScreen('menu')}
          variant="ghost"
          className="absolute top-4 left-4 text-white"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <h2 className="text-2xl font-bold mb-4 mt-8">Select Hero</h2>
        
        {/* Gender filter */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setGenderFilter('male')}
            variant={genderFilter === 'male' ? 'default' : 'outline'}
            className="rounded-full"
          >
            <User className="mr-1 h-4 w-4" /> Men
          </Button>
          <Button
            onClick={() => setGenderFilter('female')}
            variant={genderFilter === 'female' ? 'default' : 'outline'}
            className="rounded-full"
          >
            <User className="mr-1 h-4 w-4" /> Women
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-3 w-full max-w-sm pb-4">
          {heroes.map(hero => {
            const unlocked = hero.unlocked || progress.unlockedHeroes.includes(hero.id);
            const selected = selectedHeroId === hero.id;
            
            return (
              <button
                key={hero.id}
                onClick={() => {
                  if (unlocked) {
                    setSelectedHeroId(hero.id);
                    storage.selectHero(hero.id);
                    tennisAudio.click();
                  } else if (progress.coins >= hero.unlockCost) {
                    // Unlock hero
                    storage.spendCoins(hero.unlockCost);
                    const newProgress = storage.unlockHero(hero.id);
                    setProgress(newProgress);
                    setSelectedHeroId(hero.id);
                    tennisAudio.powerUp();
                  }
                }}
                className={`relative p-4 rounded-xl text-left transition-all ${
                  selected 
                    ? 'bg-yellow-500 text-gray-900 ring-4 ring-yellow-300'
                    : unlocked
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-gray-700/50'
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div className="text-4xl">{hero.avatar}</div>
                  <div className="flex-1">
                    <div className="font-bold">{hero.name}</div>
                    <div className="text-xs opacity-70">{hero.description}</div>
                    
                    {/* Stats bars */}
                    <div className="mt-2 space-y-1">
                      {(['speed', 'power', 'timing', 'spin'] as const).map(stat => (
                        <div key={stat} className="flex items-center gap-2">
                          <span className="text-xs w-12 capitalize">{stat}</span>
                          <div className="flex-1 h-2 bg-black/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-400 to-yellow-400 transition-all duration-500"
                              style={{ width: `${hero.stats[stat]}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {!unlocked && (
                    <div className="text-center">
                      <div className="text-xl">🔒</div>
                      <div className="text-xs text-yellow-400">💰 {hero.unlockCost}</div>
                    </div>
                  )}
                  {selected && <div className="text-2xl">✓</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-700 to-gray-900 text-white p-4">
      <Button
        onClick={() => setScreen('menu')}
        variant="ghost"
        className="absolute top-4 left-4 text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <h2 className="text-3xl font-bold mb-8">Settings</h2>
      
      <div className="space-y-4 w-full max-w-xs">
        <button
          onClick={toggleSound}
          className="w-full p-4 bg-white/10 rounded-xl flex items-center justify-between hover:bg-white/20 transition-all"
        >
          <span className="flex items-center gap-2">
            {progress.soundEnabled ? <Volume2 /> : <VolumeX />}
            Sound
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${progress.soundEnabled ? 'bg-green-500' : 'bg-gray-500'}`}>
            {progress.soundEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
        
        <div className="p-4 bg-white/10 rounded-xl">
          <div className="mb-2">Difficulty</div>
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  storage.setDifficulty(diff);
                  setProgress(storage.get());
                  tennisAudio.click();
                }}
                className={`flex-1 py-2 rounded-lg capitalize transition-all ${
                  progress.difficulty === diff 
                    ? 'bg-yellow-500 text-gray-900 font-bold' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
        
        <Button
          onClick={() => {
            storage.reset();
            setProgress(storage.get());
            tennisAudio.click();
          }}
          variant="destructive"
          className="w-full"
        >
          Reset Progress
        </Button>
      </div>
    </div>
  );

  const renderMatchEnd = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-black text-white p-4">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">{matchResult?.won ? '🏆' : '😢'}</div>
        <h2 className="text-3xl font-bold mb-2">
          {matchResult?.won ? 'Victory!' : 'Defeat'}
        </h2>
        <p className="text-2xl text-yellow-400">
          {matchResult?.playerScore} - {matchResult?.opponentScore}
        </p>
      </div>
      
      <div className="bg-white/10 rounded-xl p-4 w-full max-w-xs mb-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-400">{matchResult?.aces}</div>
            <div className="text-xs opacity-70">Aces</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{matchResult?.accuracy}%</div>
            <div className="text-xs opacity-70">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{matchResult?.avgReactionTime}ms</div>
            <div className="text-xs opacity-70">Avg Reaction</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-300">+{matchResult?.coinsEarned} 💰</div>
            <div className="text-xs opacity-70">Coins Earned</div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4">
        <Button onClick={startGame} className="bg-green-500 hover:bg-green-400">
          <Play className="mr-2" /> Replay
        </Button>
        <Button onClick={() => setScreen('menu')} variant="outline">
          <Home className="mr-2" /> Menu
        </Button>
      </div>
    </div>
  );

  const renderPausedOverlay = () => (
    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
      <h2 className="text-3xl font-bold mb-8">PAUSED</h2>
      <div className="flex flex-col gap-4">
        <Button onClick={() => setIsPaused(false)} className="bg-green-500 hover:bg-green-400">
          <Play className="mr-2" /> Resume
        </Button>
        <Button onClick={() => setScreen('menu')} variant="outline">
          <Home className="mr-2" /> Quit to Menu
        </Button>
      </div>
    </div>
  );

  return (
    <GameLayout title="Tennis Hero">
      <div className="relative w-full max-w-md mx-auto">
        <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}>
          
          {screen === 'menu' && renderMenuScreen()}
          {screen === 'modeSelect' && renderModeSelect()}
          {screen === 'courtSelect' && renderCourtSelect()}
          {screen === 'heroSelect' && renderHeroSelect()}
          {screen === 'settings' && renderSettings()}
          {screen === 'matchEnd' && renderMatchEnd()}
          
          {screen === 'playing' && (
            <>
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full touch-none"
                onClick={handleInput}
                onPointerMove={handlePointerMove}
              />
              
              {/* Pause button */}
              <Button
                onClick={() => setIsPaused(true)}
                variant="ghost"
                className="absolute top-2 right-2 text-white bg-black/30 hover:bg-black/50 p-2"
              >
                <Pause className="h-5 w-5" />
              </Button>
              
              {isPaused && renderPausedOverlay()}
            </>
          )}
        </div>
        
        {/* Controls hint */}
        {screen === 'playing' && !isPaused && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <span className="hidden sm:inline">Move mouse to control player • Click/Space to hit</span>
            <span className="sm:hidden">Move finger to control • Tap to hit</span>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default TennisHeroGame;
