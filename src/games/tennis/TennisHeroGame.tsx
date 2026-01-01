import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Play, Pause, Home, Settings, Trophy, Users, User, ChevronLeft, Volume2, VolumeX, Zap, Star, Target } from 'lucide-react';
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
  const [isMuted, setIsMuted] = useState(!progress.soundEnabled);
  
  // Game state refs for animation loop
  const gameStateRef = useRef<GameState | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const hitIndicatorRef = useRef<{ quality: 'perfect' | 'good' | 'early' | 'late' | 'miss' | null; alpha: number; x: number; y: number }>({ quality: null, alpha: 0, x: 0, y: 0 });
  const isSwingingRef = useRef(false);
  const matchStatsRef = useRef({ aces: 0, accuracy: 0, hits: 0, attempts: 0, reactionTimes: [] as number[] });
  const lastBallHitTimeRef = useRef(0);
  const powerUpSpawnTimerRef = useRef(0);
  const playerTargetXRef = useRef(CANVAS_WIDTH / 2);

  // Audio setup
  useEffect(() => {
    tennisAudio.setEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  const createPlayer = useCallback((isOpponent: boolean): Player => {
    const hero = getHeroById(isOpponent ? 'alex' : selectedHeroId);
    const baseY = isOpponent ? 100 : CANVAS_HEIGHT - 160;
    
    return {
      x: CANVAS_WIDTH / 2 - 25,
      y: baseY,
      width: 50,
      height: 70,
      speed: 3 + (hero.stats.speed / 100) * 4,
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
  }, [selectedHeroId]);

  const createBall = (): Ball => ({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 200,
    vx: 0,
    vy: 0,
    radius: 10,
    spin: 0,
    speed: 0,
    visible: false,
    trajectory: [],
  });

  const initGame = useCallback(() => {
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
    playerTargetXRef.current = CANVAS_WIDTH / 2;
    
    // Start serve after short delay
    setTimeout(() => serveBall(), 800);
  }, [selectedCourt, gameMode, createPlayer]);

  const serveBall = () => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    const difficulty = getAIDifficulty(gs.currentCourt);
    const isPlayerServing = gs.serving === 'player';
    
    gs.ball.x = isPlayerServing ? gs.player.x + gs.player.width / 2 : gs.opponent.x + gs.opponent.width / 2;
    gs.ball.y = isPlayerServing ? gs.player.y - 30 : gs.opponent.y + gs.opponent.height + 30;
    gs.ball.vx = (Math.random() - 0.5) * 3;
    gs.ball.vy = isPlayerServing ? -difficulty.ballSpeed : difficulty.ballSpeed;
    gs.ball.visible = true;
    gs.ball.speed = difficulty.ballSpeed;
    gs.rallyCount = 0;
    
    tennisAudio.serve();
  };

  const hitBall = (isPerfect: boolean) => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    const hero = getHeroById(selectedHeroId);
    
    // Calculate power based on timing and hero stats
    const powerMultiplier = isPerfect ? 1.6 : 1.1;
    const speedBoost = gs.activePowerUps.some(p => p.type === 'power_smash') ? 1.5 : 1;
    
    gs.ball.vy = -Math.abs(gs.ball.vy) * powerMultiplier * speedBoost;
    gs.ball.vx = (Math.random() - 0.5) * 5 * (hero.stats.spin / 100 + 0.5);
    
    // Auto aim power-up
    if (gs.activePowerUps.some(p => p.type === 'auto_aim')) {
      const targetX = gs.opponent.x + gs.opponent.width / 2;
      gs.ball.vx = (targetX - gs.ball.x) * 0.02;
    }
    
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
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 40,
        maxLife: 40,
        color: 'rgb(255, 215, 0)',
        size: 5,
        type: 'spark',
      });
    }
  };

  const createDustParticles = (x: number, y: number) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3,
        life: 25,
        maxLife: 25,
        color: 'rgb(200, 180, 160)',
        size: 7,
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
    
    if (!ball.visible || ball.vy <= 0) return; // Ball must be moving towards player
    
    matchStatsRef.current.attempts++;
    
    // Check if ball is in hit zone
    const hitZoneTop = player.y - 60;
    const hitZoneBottom = player.y + 30;
    const playerCenterX = player.x + player.width / 2;
    const distanceToPlayer = Math.abs(ball.x - playerCenterX);
    const ballInYRange = ball.y > hitZoneTop && ball.y < hitZoneBottom;
    const ballInXRange = distanceToPlayer < player.width * 2;
    
    if (ballInYRange && ballInXRange && ball.vy > 0) {
      // Calculate timing quality based on Y position
      const optimalY = player.y - 20;
      const distanceFromOptimal = Math.abs(ball.y - optimalY);
      const hero = getHeroById(selectedHeroId);
      const timingBonus = hero.stats.timing / 100;
      
      let quality: 'perfect' | 'good' | 'early' | 'late' | 'miss';
      
      if (distanceFromOptimal < 20 + timingBonus * 15) {
        quality = 'perfect';
        hitBall(true);
        matchStatsRef.current.hits++;
      } else if (distanceFromOptimal < 40 + timingBonus * 20) {
        quality = ball.y < optimalY ? 'early' : 'late';
        hitBall(false);
        matchStatsRef.current.hits++;
      } else {
        quality = 'miss';
        tennisAudio.miss();
      }
      
      hitIndicatorRef.current = { quality, alpha: 1, x: ball.x, y: ball.y - 40 };
      gs.lastHitQuality = quality;
      
      // Track reaction time
      if (lastBallHitTimeRef.current > 0) {
        matchStatsRef.current.reactionTimes.push(now - lastBallHitTimeRef.current);
      }
      lastBallHitTimeRef.current = now;
    } else {
      // Swing and miss - ball not in range
      isSwingingRef.current = true;
      setTimeout(() => { isSwingingRef.current = false; }, 150);
    }
  }, [screen, isPaused, selectedHeroId]);

  const scorePoint = useCallback((scorer: 'player' | 'opponent') => {
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
      
      // Celebration particles
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 200,
          y: CANVAS_HEIGHT / 2,
          vx: (Math.random() - 0.5) * 8,
          vy: -Math.random() * 8 - 2,
          life: 60,
          maxLife: 60,
          color: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`,
          size: 8,
          type: 'confetti',
        });
      }
    } else {
      gs.opponentScore[1]++;
    }
    
    // Tennis scoring: 0, 15, 30, 40, game
    const playerPts = gs.playerScore[1];
    const opponentPts = gs.opponentScore[1];
    
    // Check for game win
    if (playerPts >= 4 && playerPts - opponentPts >= 2) {
      // Player wins game
      gs.playerScore[0]++;
      gs.playerScore[1] = 0;
      gs.opponentScore[1] = 0;
      gs.serving = gs.serving === 'player' ? 'opponent' : 'player';
      tennisAudio.gameWon();
    } else if (opponentPts >= 4 && opponentPts - playerPts >= 2) {
      // Opponent wins game
      gs.opponentScore[0]++;
      gs.playerScore[1] = 0;
      gs.opponentScore[1] = 0;
      gs.serving = gs.serving === 'player' ? 'opponent' : 'player';
    }
    
    // Check for match end (first to 4 games for faster gameplay)
    if (gs.playerScore[0] >= 4) {
      endMatch(true);
      return;
    } else if (gs.opponentScore[0] >= 4) {
      endMatch(false);
      return;
    }
    
    // Serve again after delay
    gs.ball.visible = false;
    setTimeout(() => serveBall(), 1200);
  }, []);

  const endMatch = useCallback((won: boolean) => {
    const gs = gameStateRef.current;
    if (!gs) return;
    
    const stats = matchStatsRef.current;
    const accuracy = stats.attempts > 0 ? (stats.hits / stats.attempts) * 100 : 0;
    const avgReaction = stats.reactionTimes.length > 0 
      ? stats.reactionTimes.reduce((a, b) => a + b, 0) / stats.reactionTimes.length 
      : 0;
    
    const coinsEarned = won ? 100 + gs.currentCourt * 50 + stats.aces * 25 : 25;
    
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
  }, [gameMode, selectedCourt]);

  // AI opponent logic
  const updateAI = useCallback((gs: GameState, deltaTime: number) => {
    const difficulty = getAIDifficulty(gs.currentCourt);
    const opponent = gs.opponent;
    const ball = gs.ball;
    
    // AI moves towards predicted ball position
    if (ball.visible) {
      let targetX: number;
      
      if (ball.vy < 0) {
        // Ball moving towards opponent - predict where it will be
        const timeToReach = Math.abs((opponent.y + opponent.height - ball.y) / ball.vy);
        targetX = ball.x + ball.vx * timeToReach * 0.8;
      } else {
        // Ball moving away - return to center
        targetX = CANVAS_WIDTH / 2;
      }
      
      targetX = Math.max(60, Math.min(CANVAS_WIDTH - 60, targetX));
      
      const diff = targetX - (opponent.x + opponent.width / 2);
      const moveSpeed = (5 - difficulty.reactionTime / 150) * (deltaTime / 16);
      
      if (Math.abs(diff) > 5) {
        opponent.x += Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed);
      }
    }
    
    // Keep opponent in bounds
    opponent.x = Math.max(50, Math.min(CANVAS_WIDTH - 50 - opponent.width, opponent.x));
    
    // Check if ball reached opponent and AI should hit
    if (ball.visible && ball.vy < 0) {
      const ballNearOpponent = ball.y < opponent.y + opponent.height + 40 && ball.y > opponent.y - 20;
      const ballInRange = Math.abs(ball.x - (opponent.x + opponent.width / 2)) < opponent.width * 1.5;
      
      if (ballNearOpponent && ballInRange) {
        // AI attempts to hit
        if (Math.random() < difficulty.accuracy) {
          ball.vy = Math.abs(ball.vy) * 1.1;
          ball.vx = (Math.random() - 0.5) * 5;
          gs.rallyCount++;
          tennisAudio.hit();
          createDustParticles(ball.x, ball.y);
        }
      }
    }
  }, []);

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current || !gameStateRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const deltaTime = Math.min(timestamp - lastTimeRef.current, 32); // Cap delta to prevent jumps
    lastTimeRef.current = timestamp;
    timeRef.current = timestamp;
    
    const gs = gameStateRef.current;
    
    if (!isPaused && screen === 'playing') {
      gs.matchTime += deltaTime;
      
      // Update player position towards target
      const speedBoost = gs.activePowerUps.some(p => p.type === 'speed_boost') ? 1.8 : 1;
      const playerDiff = playerTargetXRef.current - (gs.player.x + gs.player.width / 2);
      gs.player.x += playerDiff * 0.15 * speedBoost;
      gs.player.x = Math.max(50, Math.min(CANVAS_WIDTH - 50 - gs.player.width, gs.player.x));
      
      // Update ball physics
      if (gs.ball.visible) {
        const slowMotion = gs.activePowerUps.some(p => p.type === 'slow_motion') ? 0.5 : 1;
        gs.ball.x += gs.ball.vx * slowMotion;
        gs.ball.y += gs.ball.vy * slowMotion;
        
        // Apply spin
        gs.ball.vx += gs.ball.spin * 0.05;
        
        // Dampen spin
        gs.ball.spin *= 0.99;
        
        // Wall bounces
        if (gs.ball.x < 55 || gs.ball.x > CANVAS_WIDTH - 55) {
          gs.ball.vx *= -0.85;
          gs.ball.x = gs.ball.x < 55 ? 55 : CANVAS_WIDTH - 55;
          tennisAudio.bounce();
        }
        
        // Check for scoring (ball out of bounds)
        if (gs.ball.y > CANVAS_HEIGHT + 30) {
          // Player missed - opponent scores
          scorePoint('opponent');
        } else if (gs.ball.y < -30) {
          // Opponent missed - player scores
          scorePoint('player');
        }
      }
      
      // Update AI
      updateAI(gs, deltaTime);
      
      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life--;
        return p.life > 0;
      });
      
      // Update hit indicator
      if (hitIndicatorRef.current.alpha > 0) {
        hitIndicatorRef.current.alpha -= 0.025;
        hitIndicatorRef.current.y -= 1.5;
      }
      
      // Spawn power-ups occasionally
      powerUpSpawnTimerRef.current += deltaTime;
      if (powerUpSpawnTimerRef.current > 12000 && gs.powerUpsOnCourt.length < 2 && Math.random() < 0.3) {
        gs.powerUpsOnCourt.push(createPowerUp(CANVAS_WIDTH, CANVAS_HEIGHT));
        powerUpSpawnTimerRef.current = 0;
      }
      
      // Check power-up collection by ball
      gs.powerUpsOnCourt = gs.powerUpsOnCourt.filter(pu => {
        if (!pu.active) return false;
        const dist = Math.hypot(gs.ball.x - pu.x, gs.ball.y - pu.y);
        if (dist < 35 && gs.ball.visible) {
          gs.activePowerUps.push({ type: pu.type, endTime: timestamp + pu.duration });
          tennisAudio.powerUp();
          
          // Power-up collection particles
          for (let i = 0; i < 8; i++) {
            particlesRef.current.push({
              x: pu.x,
              y: pu.y,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              life: 30,
              maxLife: 30,
              color: POWER_UP_CONFIGS[pu.type].color,
              size: 6,
              type: 'spark',
            });
          }
          return false;
        }
        return true;
      });
      
      // Expire power-ups
      gs.activePowerUps = gs.activePowerUps.filter(p => p.endTime > timestamp);
    }
    
    // === RENDER ===
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
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.roundRect(8, 65, 110, 28 * gs.activePowerUps.length + 8, 8);
      ctx.fill();
      
      gs.activePowerUps.forEach((pu, i) => {
        const config = POWER_UP_CONFIGS[pu.type];
        const remaining = Math.max(0, (pu.endTime - timestamp) / 1000);
        ctx.font = 'bold 13px Arial';
        ctx.fillStyle = config.color;
        ctx.textAlign = 'left';
        ctx.fillText(`${config.icon} ${remaining.toFixed(1)}s`, 16, 88 + i * 28);
      });
    }
    
    // Timing hint when ball approaching player
    if (gs.ball.visible && gs.ball.vy > 0 && gs.ball.y > CANVAS_HEIGHT * 0.45 && gs.ball.y < CANVAS_HEIGHT * 0.75) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      ctx.strokeText('TAP TO HIT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
      ctx.fillText('TAP TO HIT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }
    
    // Rally counter
    if (gs.rallyCount > 0) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Rally: ${gs.rallyCount}`, CANVAS_WIDTH - 15, 75);
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, screen, selectedHeroId, scorePoint, updateAI]);

  // Handle player movement (touch/mouse)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current || screen !== 'playing' || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    
    playerTargetXRef.current = Math.max(60, Math.min(CANVAS_WIDTH - 60, x));
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
      if (e.code === 'Space' && screen === 'playing' && !isPaused) {
        e.preventDefault();
        handleInput();
      } else if (e.code === 'Escape' && screen === 'playing') {
        setIsPaused(p => !p);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handleInput, isPaused]);

  const startGame = useCallback(() => {
    initGame();
    setScreen('playing');
    setIsPaused(false);
    setMatchResult(null);
  }, [initGame]);

  const toggleSound = () => {
    const newProgress = storage.toggleSound();
    setProgress(newProgress);
    setIsMuted(!newProgress.soundEnabled);
    tennisAudio.setEnabled(newProgress.soundEnabled);
    tennisAudio.click();
  };

  // Render Menu Screen
  const renderMenuScreen = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent" />
      
      {/* Animated decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-8 left-8 w-24 h-24 rounded-full bg-yellow-300/30 blur-xl animate-pulse" />
        <div className="absolute bottom-16 right-8 w-32 h-32 rounded-full bg-green-300/20 blur-2xl" />
        <div className="absolute top-1/4 right-1/4 text-7xl opacity-30 animate-bounce">🎾</div>
        <div className="absolute bottom-1/4 left-1/5 text-5xl opacity-20 rotate-12">🏆</div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-6">
        {/* Title */}
        <div className="mb-6">
          <div className="text-6xl mb-3">🎾</div>
          <h1 className="text-4xl font-black text-white mb-1 tracking-tight" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.3)' }}>
            TENNIS HERO
          </h1>
          <p className="text-green-100 text-sm font-medium">Become a Champion!</p>
        </div>
        
        {/* Hero preview */}
        <div className="text-6xl mb-6 drop-shadow-lg">{getHeroById(selectedHeroId).avatar}</div>
        
        {/* Menu buttons */}
        <div className="flex flex-col gap-3 w-full max-w-[280px] mx-auto">
          <Button
            onClick={() => { setScreen('modeSelect'); tennisAudio.click(); }}
            className="h-14 text-lg bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-amber-900 font-bold rounded-2xl shadow-lg shadow-yellow-500/30 transform hover:scale-105 transition-all border-0"
          >
            <Play className="mr-2 h-6 w-6" /> Play Now
          </Button>
          
          <Button
            onClick={() => { setScreen('heroSelect'); tennisAudio.click(); }}
            className="h-12 text-base bg-white/20 hover:bg-white/30 text-white font-semibold rounded-2xl backdrop-blur-sm border border-white/30"
          >
            <Users className="mr-2 h-5 w-5" /> Select Hero
          </Button>
          
          <Button
            onClick={() => { setScreen('settings'); tennisAudio.click(); }}
            className="h-12 text-base bg-white/10 hover:bg-white/20 text-white/90 font-medium rounded-2xl backdrop-blur-sm border border-white/20"
          >
            <Settings className="mr-2 h-5 w-5" /> Settings
          </Button>
        </div>
      </div>
      
      {/* Bottom stats */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-5 text-white/80 text-sm">
        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full">
          <span className="text-yellow-300">💰</span>
          <span className="font-semibold">{progress.coins}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full">
          <Trophy className="h-4 w-4 text-yellow-300" />
          <span className="font-semibold">{progress.totalWins}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full">
          <Star className="h-4 w-4 text-yellow-300" />
          <span className="font-semibold">Lv.{progress.highestLevel}</span>
        </div>
      </div>
    </div>
  );

  const renderModeSelect = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-4">
      <Button
        onClick={() => { setScreen('menu'); tennisAudio.click(); }}
        variant="ghost"
        className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <h2 className="text-2xl font-bold text-white mb-6">Select Mode</h2>
      
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm px-2">
        {[
          { mode: 'career' as GameMode, name: 'Career', icon: '🏆', desc: 'Climb the ranks', color: 'from-amber-500 to-orange-600' },
          { mode: 'quickMatch' as GameMode, name: 'Quick Play', icon: '⚡', desc: 'Jump right in', color: 'from-cyan-500 to-blue-600' },
          { mode: 'practice' as GameMode, name: 'Practice', icon: '🎯', desc: 'Hone your skills', color: 'from-emerald-500 to-green-600' },
          { mode: 'challenge' as GameMode, name: 'Challenge', icon: '🔥', desc: 'Daily missions', color: 'from-rose-500 to-red-600' },
        ].map(m => (
          <button
            key={m.mode}
            onClick={() => {
              setGameMode(m.mode);
              setScreen('courtSelect');
              tennisAudio.click();
            }}
            className={`p-4 rounded-2xl bg-gradient-to-br ${m.color} text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all border border-white/20`}
          >
            <div className="text-3xl mb-2">{m.icon}</div>
            <div className="font-bold text-sm">{m.name}</div>
            <div className="text-[10px] opacity-80">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCourtSelect = () => (
    <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white overflow-hidden">
      <div className="flex items-center p-3 border-b border-white/10">
        <Button
          onClick={() => { setScreen('modeSelect'); tennisAudio.click(); }}
          variant="ghost"
          className="text-white/80 hover:text-white hover:bg-white/10 p-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-bold flex-1 text-center pr-8">Select Court</h2>
      </div>
      
      <div className="flex-1 overflow-auto p-3 space-y-2.5">
        {COURTS.map(court => {
          const unlocked = court.unlockLevel <= progress.highestLevel;
          const completed = progress.completedLevels.includes(court.id);
          
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
              className={`relative w-full p-3.5 rounded-xl text-left transition-all ${
                unlocked 
                  ? 'shadow-lg transform hover:scale-[1.02] active:scale-[0.98]'
                  : 'opacity-40 grayscale'
              }`}
              style={unlocked ? { 
                background: `linear-gradient(135deg, ${court.bgColors[0]}, ${court.bgColors[1] || court.bgColors[0]})` 
              } : { background: '#374151' }}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base truncate">{court.name}</div>
                  <div className="text-xs opacity-80 truncate">{court.description}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-black/20 rounded-full uppercase font-medium">
                      {court.surface}
                    </span>
                    {completed && (
                      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/30 rounded-full flex items-center gap-1">
                        <Star className="h-3 w-3" /> Done
                      </span>
                    )}
                  </div>
                </div>
                {!unlocked && <div className="text-2xl">🔒</div>}
                {unlocked && <ChevronLeft className="h-5 w-5 rotate-180 opacity-60" />}
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
      <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-blue-900 to-indigo-950 text-white overflow-hidden">
        <div className="flex items-center p-3 border-b border-white/10">
          <Button
            onClick={() => { setScreen('menu'); tennisAudio.click(); }}
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold flex-1 text-center pr-8">Select Hero</h2>
        </div>
        
        {/* Gender filter */}
        <div className="flex gap-2 p-3 justify-center">
          {(['male', 'female'] as const).map(g => (
            <Button
              key={g}
              onClick={() => { setGenderFilter(g); tennisAudio.click(); }}
              className={`rounded-full px-5 ${
                genderFilter === g 
                  ? 'bg-white text-indigo-900' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <User className="mr-1.5 h-4 w-4" /> {g === 'male' ? 'Men' : 'Women'}
            </Button>
          ))}
        </div>
        
        <div className="flex-1 overflow-auto p-3 space-y-2.5">
          {heroes.map(hero => {
            const unlocked = hero.unlocked || progress.unlockedHeroes.includes(hero.id);
            const selected = selectedHeroId === hero.id;
            const canAfford = progress.coins >= hero.unlockCost;
            
            return (
              <button
                key={hero.id}
                onClick={() => {
                  if (unlocked) {
                    setSelectedHeroId(hero.id);
                    storage.selectHero(hero.id);
                    tennisAudio.click();
                  } else if (canAfford) {
                    storage.spendCoins(hero.unlockCost);
                    const newProgress = storage.unlockHero(hero.id);
                    setProgress(newProgress);
                    setSelectedHeroId(hero.id);
                    tennisAudio.powerUp();
                  }
                }}
                className={`relative w-full p-3 rounded-xl text-left transition-all ${
                  selected 
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 ring-2 ring-yellow-300 shadow-lg shadow-yellow-500/30'
                    : unlocked
                      ? 'bg-white/10 hover:bg-white/15 border border-white/10'
                      : 'bg-white/5 border border-white/5'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <div className={`text-4xl ${!unlocked && 'grayscale opacity-50'}`}>{hero.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${selected ? 'text-amber-900' : ''}`}>{hero.name}</div>
                    <div className={`text-[10px] mb-2 ${selected ? 'text-amber-800' : 'opacity-60'}`}>{hero.description}</div>
                    
                    {/* Stats bars */}
                    <div className="space-y-1">
                      {(['speed', 'power', 'timing', 'spin'] as const).map(stat => (
                        <div key={stat} className="flex items-center gap-2">
                          <span className={`text-[9px] w-10 capitalize ${selected ? 'text-amber-800' : 'opacity-70'}`}>{stat}</span>
                          <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${selected ? 'bg-amber-900/30' : 'bg-white/20'}`}>
                            <div 
                              className={`h-full rounded-full ${selected ? 'bg-amber-900' : 'bg-gradient-to-r from-green-400 to-emerald-300'}`}
                              style={{ width: `${hero.stats[stat]}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {!unlocked && (
                    <div className={`text-center ${canAfford ? 'text-yellow-400' : 'text-gray-400'}`}>
                      <div className="text-lg">🔒</div>
                      <div className="text-[10px] font-bold">💰{hero.unlockCost}</div>
                    </div>
                  )}
                  {selected && <div className="text-xl">✓</div>}
                </div>
              </button>
            );
          })}
        </div>
        
        {/* Coins display */}
        <div className="p-3 border-t border-white/10 flex justify-center">
          <div className="bg-black/30 px-4 py-2 rounded-full flex items-center gap-2">
            <span className="text-yellow-300 text-lg">💰</span>
            <span className="font-bold">{progress.coins}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 text-white p-6">
      <Button
        onClick={() => { setScreen('menu'); tennisAudio.click(); }}
        variant="ghost"
        className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <Settings className="h-12 w-12 text-white/30 mb-4" />
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      
      <div className="space-y-4 w-full max-w-xs">
        <button
          onClick={toggleSound}
          className="w-full p-4 bg-white/10 rounded-xl flex items-center justify-between hover:bg-white/15 transition-all border border-white/10"
        >
          <span className="flex items-center gap-3">
            {progress.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 opacity-50" />}
            <span>Sound</span>
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${progress.soundEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
            {progress.soundEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
        
        <div className="p-4 bg-white/10 rounded-xl border border-white/10">
          <div className="mb-3 text-sm opacity-70">Difficulty</div>
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as const).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  storage.setDifficulty(diff);
                  setProgress(storage.get());
                  tennisAudio.click();
                }}
                className={`flex-1 py-2.5 rounded-lg capitalize text-sm font-medium transition-all ${
                  progress.difficulty === diff 
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900' 
                    : 'bg-white/10 hover:bg-white/15'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
        
        <Button
          onClick={() => {
            if (confirm('Reset all progress?')) {
              storage.reset();
              setProgress(storage.get());
              setSelectedHeroId('alex');
              tennisAudio.click();
            }
          }}
          variant="destructive"
          className="w-full rounded-xl"
        >
          Reset Progress
        </Button>
      </div>
    </div>
  );

  const renderMatchEnd = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <div className="text-center mb-5">
        <div className="text-7xl mb-3">{matchResult?.won ? '🏆' : '😢'}</div>
        <h2 className="text-3xl font-black mb-1">
          {matchResult?.won ? 'VICTORY!' : 'DEFEAT'}
        </h2>
        <p className="text-3xl font-bold text-yellow-400">
          {matchResult?.playerScore} - {matchResult?.opponentScore}
        </p>
      </div>
      
      <div className="bg-white/10 rounded-2xl p-4 w-full max-w-xs mb-5 border border-white/10">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-400">{matchResult?.aces}</div>
            <div className="text-[10px] opacity-60 uppercase">Aces</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{matchResult?.accuracy}%</div>
            <div className="text-[10px] opacity-60 uppercase">Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{matchResult?.avgReactionTime}ms</div>
            <div className="text-[10px] opacity-60 uppercase">Reaction</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-300">+{matchResult?.coinsEarned}</div>
            <div className="text-[10px] opacity-60 uppercase">Coins 💰</div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3 w-full max-w-xs">
        <Button 
          onClick={startGame} 
          className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold"
        >
          <Play className="mr-2 h-5 w-5" /> Replay
        </Button>
        <Button 
          onClick={() => setScreen('menu')} 
          className="flex-1 h-12 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20"
        >
          <Home className="mr-2 h-5 w-5" /> Menu
        </Button>
      </div>
    </div>
  );

  const renderPausedOverlay = () => (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
      <Pause className="h-16 w-16 text-white/30 mb-4" />
      <h2 className="text-3xl font-bold mb-6">PAUSED</h2>
      <div className="flex flex-col gap-3 w-48">
        <Button 
          onClick={() => setIsPaused(false)} 
          className="h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold"
        >
          <Play className="mr-2" /> Resume
        </Button>
        <Button 
          onClick={() => { setScreen('menu'); setIsPaused(false); }} 
          className="h-12 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20"
        >
          <Home className="mr-2" /> Quit
        </Button>
      </div>
    </div>
  );

  return (
    <GameLayout 
      gameId="tennis-hero" 
      title="Tennis Hero"
      showAudioControl
      isMuted={isMuted}
      onToggleMute={toggleSound}
    >
      <div className="relative w-full max-w-md mx-auto">
        <div 
          className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" 
          style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
        >
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
                className="w-full h-full touch-none cursor-pointer"
                onClick={handleInput}
                onPointerMove={handlePointerMove}
              />
              
              {/* Pause button */}
              <Button
                onClick={() => setIsPaused(true)}
                variant="ghost"
                className="absolute top-14 right-2 text-white bg-black/40 hover:bg-black/60 p-2 rounded-lg z-10"
              >
                <Pause className="h-5 w-5" />
              </Button>
              
              {isPaused && renderPausedOverlay()}
            </>
          )}
        </div>
        
        {/* Controls hint */}
        {screen === 'playing' && !isPaused && (
          <div className="mt-3 text-center text-xs text-muted-foreground">
            <span className="hidden sm:inline">Move mouse to position • Click or Space to swing</span>
            <span className="sm:hidden">Drag to move • Tap to swing</span>
          </div>
        )}
      </div>
    </GameLayout>
  );
};

export default TennisHeroGame;
