import React, { useRef, useEffect, useState, useCallback } from 'react';
import GameLayout from '@/components/GameLayout';
import { Button } from '@/components/ui/button';
import { Play, Pause, Home, Settings, Trophy, Users, User, ChevronLeft, ChevronRight, Volume2, VolumeX, Zap, Star, Target, Lock, Unlock } from 'lucide-react';
import { GameState, GameScreen, GameMode, Player, Ball, PowerUp, Particle, MatchResult } from './types';
import { COURTS, getCourtById, getAIDifficulty } from './courts';
import { HEROES, getHeroById, getHeroesByGender } from './heroes';
import { storage } from './storage';
import { tennisAudio } from './audio';
import { createPowerUp, POWER_UP_CONFIGS } from './powerups';
import { CAREER_MISSIONS, getMissionById, getCountryById, getNextMission, getMissionProgress, CountryMission, MissionMatch } from './missions';
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
  
  // Career Mode - Missions
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<MissionMatch | null>(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [heroUpgradeLevel, setHeroUpgradeLevel] = useState(progress.heroUpgradeLevel[selectedHeroId] || 1);
  
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
      slowMotionActive: false,
      slowMotionStartTime: 0,
      slowMotionDuration: 3000, // 3 seconds in milliseconds
      clickToHitActive: false,
      targetClickPos: null,
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

  const hitBall = useCallback((isPerfect: boolean, targetPos?: { x: number; y: number }) => {
    if (!gameStateRef.current) return;
    
    const gs = gameStateRef.current;
    const hero = getHeroById(selectedHeroId);
    
    // Calculate power based on timing and hero stats
    const powerMultiplier = isPerfect ? 1.6 : 1.1;
    const speedBoost = gs.activePowerUps.some(p => p.type === 'power_smash') ? 1.5 : 1;
    
    if (targetPos) {
      // Click-to-hit: Calculate direction and velocity based on target
      const ballX = gs.ball.x;
      const ballY = gs.ball.y;
      const dx = targetPos.x - ballX;
      const dy = targetPos.y - ballY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        // Normalize and apply power
        const baseSpeed = 6 + (hero.stats.power / 100) * 4;
        const finalSpeed = baseSpeed * speedBoost * (isPerfect ? 1.3 : 1.0);
        
        gs.ball.vx = (dx / distance) * finalSpeed;
        gs.ball.vy = (dy / distance) * finalSpeed;
        
        // Add spin based on hero stats
        gs.ball.spin = (hero.stats.spin / 100) * (Math.random() - 0.5);
      }
    } else {
      // Regular hit (original behavior)
      gs.ball.vy = -Math.abs(gs.ball.vy) * powerMultiplier * speedBoost;
      gs.ball.vx = (Math.random() - 0.5) * 5 * (hero.stats.spin / 100 + 0.5);
      
      // Auto aim power-up
      if (gs.activePowerUps.some(p => p.type === 'auto_aim')) {
        const targetX = gs.opponent.x + gs.opponent.width / 2;
        gs.ball.vx = (targetX - gs.ball.x) * 0.02;
      }
      
      gs.ball.spin = (hero.stats.spin / 100) * (Math.random() - 0.5);
    }
    
    gs.rallyCount++;
    
    if (isPerfect) {
      tennisAudio.perfectHit();
      createSparkParticles(gs.ball.x, gs.ball.y);
    } else {
      tennisAudio.hit();
    }
    
    isSwingingRef.current = true;
    setTimeout(() => { isSwingingRef.current = false; }, 150);
  }, [selectedHeroId]);

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
    
    // Check if ball is in hit zone
    const hitZoneTop = player.y - 80;
    const hitZoneBottom = player.y + 30;
    const playerCenterX = player.x + player.width / 2;
    const distanceToPlayer = Math.abs(ball.x - playerCenterX);
    const ballInYRange = ball.y > hitZoneTop && ball.y < hitZoneBottom;
    const ballInXRange = distanceToPlayer < player.width * 3;
    
    // Activate slow motion when ball is approaching
    if (ballInYRange && ballInXRange && ball.vy > 0 && !gs.slowMotionActive) {
      gs.slowMotionActive = true;
      gs.slowMotionStartTime = now;
      gs.clickToHitActive = true;
      tennisAudio.hit(); // Give feedback
      return;
    }
  }, [screen, isPaused]);

  const endMatch = useCallback((won: boolean) => {
    const gs = gameStateRef.current;
    if (!gs) return;
    
    const stats = matchStatsRef.current;
    const accuracy = stats.attempts > 0 ? (stats.hits / stats.attempts) * 100 : 0;
    const avgReaction = stats.reactionTimes.length > 0 
      ? stats.reactionTimes.reduce((a, b) => a + b, 0) / stats.reactionTimes.length 
      : 0;
    
    // Calculate mode-specific coin rewards
    let coinsEarned = 0;
    let modeBonus = '';
    
    if (gameMode === 'career') {
      // Career: rewards based on mission
      if (selectedMission) {
        coinsEarned = won ? selectedMission.reward : 0;
        modeBonus = won ? 'Mission Complete!' : 'Mission Lost';
        // Store mission completion
        if (won) {
          storage.completeMission(selectedMission.id);
        }
      } else {
        coinsEarned = won ? 100 + gs.currentCourt * 50 + stats.aces * 25 : 25;
        modeBonus = won ? 'Level Complete!' : 'Level Lost';
      }
    } else if (gameMode === 'quickMatch') {
      // Quick Play: instant rewards, no multiplier
      coinsEarned = won ? 75 + gs.currentCourt * 30 : 15;
      modeBonus = 'Quick Match Completed';
    } else if (gameMode === 'practice') {
      // Practice: no coin rewards, only experience
      coinsEarned = 0;
      modeBonus = 'Practice Session';
    } else if (gameMode === 'challenge') {
      // Challenge: 3x multiplier for wins, 0 for losses
      coinsEarned = won ? (150 + gs.currentCourt * 75 + stats.aces * 50) : 0;
      modeBonus = won ? '🔥 3x Challenge Bonus!' : 'Challenge Failed';
    }
    
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
    if (won && gameMode === 'career' && selectedMission) {
      newProgress = storage.completeMission(selectedMission.id);
    }
    if (won && gameMode === 'career' && !selectedMission) {
      newProgress = storage.completeLevel(selectedCourt, gs.playerScore[0] * 100);
    }
    setProgress(newProgress);
    
    if (won) {
      tennisAudio.matchWon();
    } else {
      tennisAudio.matchLost();
    }
  }, [gameMode, selectedCourt, selectedMission]);

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
  }, [endMatch]);

  // Track which ball the AI is trying to hit to avoid multiple hits
  const aiHitAttemptRef = useRef<{ ballId: number; timestamp: number }>({ ballId: -1, timestamp: 0 });

  // AI opponent logic
  const updateAI = useCallback((gs: GameState, deltaTime: number) => {
    // Determine AI difficulty based on game mode
    let difficulty = getAIDifficulty(gs.currentCourt);
    
    if (gameMode === 'practice') {
      // Practice mode: always use easiest difficulty (Level 1)
      difficulty = getAIDifficulty(1);
    } else if (gameMode === 'challenge') {
      // Challenge mode: always use hardest difficulty (Level 8)
      difficulty = getAIDifficulty(8);
    } else if (gameMode === 'career' && selectedMission) {
      // Career mode: use mission difficulty
      difficulty = getAIDifficulty(selectedMission.difficulty);
    }
    
    const opponent = gs.opponent;
    const ball = gs.ball;
    
    // AI moves towards predicted ball position
    if (ball.visible && ball.vy < 0) {
      // Ball is moving towards opponent
      let targetX: number;
      
      // Calculate time for ball to reach opponent's y position
      const distanceY = opponent.y + opponent.height - ball.y;
      
      if (ball.vy !== 0 && distanceY > 0) {
        // Predict where ball will be when it reaches opponent's court
        const timeToReach = distanceY / Math.abs(ball.vy);
        targetX = ball.x + ball.vx * timeToReach;
      } else {
        // Default: move towards ball's current x position
        targetX = ball.x;
      }
      
      // Clamp target to court boundaries
      targetX = Math.max(60, Math.min(CANVAS_WIDTH - 60, targetX));
      
      // Calculate movement towards target
      const diff = targetX - (opponent.x + opponent.width / 2);
      
      // Much slower AI movement - based on reaction time (lower level = slower)
      const baseSpeed = 1.5 + (difficulty.reactionTime / 1000); // Much slower base speed
      const moveSpeed = baseSpeed * (deltaTime / 16);
      
      // Move towards target gradually
      if (Math.abs(diff) > 3) {
        opponent.x += Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed);
      }
    } else if (ball.visible && ball.vy >= 0) {
      // Ball moving away - return to center slowly
      const centerX = CANVAS_WIDTH / 2;
      const diff = centerX - (opponent.x + opponent.width / 2);
      const returnSpeed = 1.5 * (deltaTime / 16);
      
      if (Math.abs(diff) > 3) {
        opponent.x += Math.sign(diff) * Math.min(Math.abs(diff), returnSpeed);
      }
    }
    
    // Keep opponent in bounds
    opponent.x = Math.max(50, Math.min(CANVAS_WIDTH - 50 - opponent.width, opponent.x));
    
    // Check if ball reached opponent and AI should hit
    if (ball.visible && ball.vy < 0) {
      // More realistic hit detection - much tighter zones
      const ballNearOpponent = ball.y < opponent.y + opponent.height + 50 && ball.y > opponent.y - 40;
      const opponentCenterX = opponent.x + opponent.width / 2;
      const distanceFromCenter = Math.abs(ball.x - opponentCenterX);
      const ballInXRange = distanceFromCenter < opponent.width * 0.7; // Much tighter! Only 70% of width
      
      if (ballNearOpponent && ballInXRange) {
        // Calculate complexity factors that affect accuracy
        const ballSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const speedFactor = Math.min(1, ballSpeed / 8); // Faster balls are much harder to hit
        
        // Distance from optimal hit position (center of opponent)
        const distanceFactor = Math.min(1, distanceFromCenter / (opponent.width * 0.35));
        
        // Base accuracy with MUCH stronger complexity penalties
        let hitChance = difficulty.accuracy;
        hitChance *= (1 - speedFactor * 0.6); // 60% penalty for fast balls (was 30%)
        hitChance *= (1 - distanceFactor * 0.5); // 50% penalty for off-center balls (was 20%)
        
        // Additional penalty for extreme off-center hits
        if (distanceFromCenter > opponent.width * 0.5) {
          hitChance *= 0.4; // 60% penalty for very off-center
        }
        
        // Only allow one hit attempt per ball to avoid double-hits
        const now = performance.now();
        const ballKey = Math.floor(ball.x) + Math.floor(ball.y) * 1000; // Simple ball identity
        const isNewBall = aiHitAttemptRef.current.ballId !== ballKey || (now - aiHitAttemptRef.current.timestamp) > 200;
        
        if (isNewBall && Math.random() < hitChance) {
          // Success! Opponent hits back
          aiHitAttemptRef.current = { ballId: ballKey, timestamp: now };
          
          // Opponent hits back towards player with error margin
          const targetY = gs.player.y;
          const dx = (gs.player.x + gs.player.width / 2) - ball.x;
          const dy = targetY - ball.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            // Send ball towards player with realistic error based on difficulty
            const accuracy = difficulty.accuracy;
            const errorMargin = (1 - accuracy) * 200; // Much larger error margin
            
            // More error in lower difficulties
            const baseError = errorMargin * (1 + speedFactor * 0.8);
            const errorX = (Math.random() - 0.5) * baseError;
            const errorY = (Math.random() - 0.5) * baseError * 0.4;
            
            const targetX = (gs.player.x + gs.player.width / 2) + errorX;
            const targetYAdjusted = targetY + errorY;
            
            const finalDx = targetX - ball.x;
            const finalDy = targetYAdjusted - ball.y;
            const finalDistance = Math.sqrt(finalDx * finalDx + finalDy * finalDy);
            
            if (finalDistance > 0) {
              // Return ball speed based on difficulty and incoming ball speed
              const returnSpeed = 3 + (difficulty.ballSpeed / 2) * (0.6 + Math.random() * 0.4);
              ball.vx = (finalDx / finalDistance) * returnSpeed;
              ball.vy = (finalDy / finalDistance) * returnSpeed;
            }
          }
          
          gs.rallyCount++;
          tennisAudio.hit();
          createDustParticles(ball.x, ball.y);
        } else if (isNewBall) {
          // Opponent missed!
          aiHitAttemptRef.current = { ballId: ballKey, timestamp: now };
        }
      }
    }
  }, [gameMode, selectedMission]);

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
      
      // Challenge mode: check for time limit (5 minutes = 300000ms)
      if (gameMode === 'challenge' && gs.matchTime > 300000) {
        // Time's up! End match - opponent wins
        endMatch(false);
        return;
      }
      
      // Update slow motion timer
      if (gs.slowMotionActive) {
        const elapsed = performance.now() - gs.slowMotionStartTime;
        if (elapsed >= gs.slowMotionDuration) {
          // Slow motion expired, end the mechanic
          gs.slowMotionActive = false;
          gs.clickToHitActive = false;
          gs.targetClickPos = null;
          // Auto-hit towards center if no click was made
          if (gs.ball.visible) {
            hitBall(false, { x: CANVAS_WIDTH / 2, y: gs.opponent.y });
          }
        }
      }
      
      // Update player position towards target
      const speedBoost = gs.activePowerUps.some(p => p.type === 'speed_boost') ? 1.8 : 1;
      const playerDiff = playerTargetXRef.current - (gs.player.x + gs.player.width / 2);
      gs.player.x += playerDiff * 0.15 * speedBoost;
      gs.player.x = Math.max(50, Math.min(CANVAS_WIDTH - 50 - gs.player.width, gs.player.x));
      
      // Update ball physics
      if (gs.ball.visible) {
        // Combine slow motion from power-ups and the new mechanic
        let slowMotionMultiplier = 1;
        if (gs.activePowerUps.some(p => p.type === 'slow_motion')) {
          slowMotionMultiplier *= 0.5;
        }
        if (gs.slowMotionActive && gs.clickToHitActive) {
          slowMotionMultiplier *= 0.3; // 70% slower during click-to-hit mechanic
        }
        
        gs.ball.x += gs.ball.vx * slowMotionMultiplier;
        gs.ball.y += gs.ball.vy * slowMotionMultiplier;
        
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
      
      // Update AI (disabled during slow motion)
      if (!gs.slowMotionActive) {
        updateAI(gs, deltaTime);
      }
      
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
    if (!gs.slowMotionActive && gs.ball.visible && gs.ball.vy > 0 && gs.ball.y > CANVAS_HEIGHT * 0.45 && gs.ball.y < CANVAS_HEIGHT * 0.75) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      ctx.strokeText('TAP TO HIT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
      ctx.fillText('TAP TO HIT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    }
    
    // Slow motion timer on canvas
    if (gs.slowMotionActive && gs.clickToHitActive) {
      const remaining = Math.max(0, (gs.slowMotionStartTime + gs.slowMotionDuration - timestamp) / 1000);
      
      // Draw semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw timer
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(remaining.toFixed(1) + 's', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      ctx.fillText(remaining.toFixed(1) + 's', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      
      // Draw instruction
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText('Click to hit the ball!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      ctx.fillText('Click to hit the ball!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
      
      // Draw target reticle if we have a target position
      if (gs.targetClickPos) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gs.targetClickPos.x, gs.targetClickPos.y, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw crosshairs
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gs.targetClickPos.x - 15, gs.targetClickPos.y);
        ctx.lineTo(gs.targetClickPos.x + 15, gs.targetClickPos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(gs.targetClickPos.x, gs.targetClickPos.y - 15);
        ctx.lineTo(gs.targetClickPos.x, gs.targetClickPos.y + 15);
        ctx.stroke();
      }
    }
    
    // Challenge Mode: Time remaining
    if (gameMode === 'challenge') {
      const timeRemaining = Math.max(0, 300 - Math.floor(gs.matchTime / 1000)); // 5 minutes = 300 seconds
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      
      const isWarning = timeRemaining <= 30; // Warning when 30 seconds or less
      
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = isWarning ? 'rgba(255, 100, 100, 0.9)' : 'rgba(255, 200, 0, 0.9)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.lineWidth = 3;
      const timeText = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.strokeText(timeText, CANVAS_WIDTH / 2, 45);
      ctx.fillText(timeText, CANVAS_WIDTH / 2, 45);
    }
    
    // Rally counter
    if (gs.rallyCount > 0) {
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Rally: ${gs.rallyCount}`, CANVAS_WIDTH - 15, 75);
    }
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [isPaused, screen, selectedHeroId, scorePoint, updateAI, hitBall]);

  // Handle player movement (touch/mouse)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current || screen !== 'playing' || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    
    // If in slow motion, track cursor for targeting
    const gs = gameStateRef.current;
    if (gs.slowMotionActive && gs.clickToHitActive) {
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      gs.targetClickPos = { x, y };
    } else {
      // Normal movement: move player towards cursor
      playerTargetXRef.current = Math.max(60, Math.min(CANVAS_WIDTH - 60, x));
    }
  }, [screen, isPaused]);

  // Handle canvas click for slow motion hitting
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    if (!gameStateRef.current || screen !== 'playing' || isPaused) return;
    
    const gs = gameStateRef.current;
    if (!gs.slowMotionActive || !gs.clickToHitActive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Hit the ball towards the clicked position
    matchStatsRef.current.attempts++;
    matchStatsRef.current.hits++;
    
    const isPerfect = Math.random() < 0.4; // 40% chance of perfect hit
    hitBall(isPerfect, { x, y });
    
    // End slow motion
    gs.slowMotionActive = false;
    gs.clickToHitActive = false;
    gs.targetClickPos = null;
    
    hitIndicatorRef.current = { 
      quality: isPerfect ? 'perfect' : 'good', 
      alpha: 1, 
      x: gs.ball.x, 
      y: gs.ball.y - 40 
    };
  }, [screen, isPaused, hitBall]);

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

  const getNextMissionToPlay = (): MissionMatch | null => {
    if (!selectedMission) return null;
    
    // Find current country and mission index
    let currentCountryIndex = -1;
    let currentMissionIndex = -1;
    
    for (let i = 0; i < CAREER_MISSIONS.length; i++) {
      const missionIndex = CAREER_MISSIONS[i].matches.findIndex(m => m.id === selectedMission.id);
      if (missionIndex !== -1) {
        currentCountryIndex = i;
        currentMissionIndex = missionIndex;
        break;
      }
    }
    
    if (currentCountryIndex === -1) return null;
    
    const currentCountry = CAREER_MISSIONS[currentCountryIndex];
    
    // Check if there are more missions in the current country
    if (currentMissionIndex < currentCountry.matches.length - 1) {
      const nextMission = currentCountry.matches[currentMissionIndex + 1];
      // Check if mission is unlocked (previous mission completed or it's first mission)
      const isPreviousCompleted = currentMissionIndex === 0 || progress.completedMissions.includes(currentCountry.matches[currentMissionIndex].id);
      if (isPreviousCompleted && heroUpgradeLevel >= nextMission.requiredPowerLevel) {
        return nextMission;
      }
    }
    
    // If current country is complete, check next country
    if (currentCountryIndex < CAREER_MISSIONS.length - 1) {
      const nextCountry = CAREER_MISSIONS[currentCountryIndex + 1];
      // Check if next country can be unlocked (current country complete)
      const isCurrentCountryComplete = currentCountry.matches.every(m => progress.completedMissions.includes(m.id));
      if (isCurrentCountryComplete) {
        const firstMissionNextCountry = nextCountry.matches[0];
        if (heroUpgradeLevel >= firstMissionNextCountry.requiredPowerLevel) {
          return firstMissionNextCountry;
        }
      }
    }
    
    return null;
  };

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

  const renderCountrySelect = () => {
    const { completedCount, totalMissions, percentage } = getMissionProgress(progress.completedMissions);

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-auto">
        <Button
          onClick={() => { setScreen('modeSelect'); tennisAudio.click(); }}
          variant="ghost"
          className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <h2 className="text-2xl font-bold text-white mb-1 mt-6">Career Missions</h2>
        <p className="text-white/70 text-xs text-center mb-4">Travel across the world to become the greatest</p>

        {/* Overall Progress */}
        <div className="w-full max-w-md mb-6 px-2">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/80 text-sm font-semibold">Global Progress</span>
              <span className="text-white font-bold">{completedCount}/{totalMissions}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-2">{percentage}% Complete</p>
          </div>
        </div>

        {/* Countries Grid */}
        <div className="w-full max-w-md space-y-3 px-2">
          {CAREER_MISSIONS.map((country, index) => {
            const countryMissions = country.matches;
            const completedInCountry = countryMissions.filter(m => progress.completedMissions.includes(m.id)).length;
            const isCountryComplete = completedInCountry === countryMissions.length;
            
            // Country is accessible if: it's the first country, or if it has started, or if the previous country is complete
            const previousCountryComplete = index > 0 ? 
              CAREER_MISSIONS[index - 1].matches.every(m => progress.completedMissions.includes(m.id)) : 
              true;
            const canPlayCountry = completedInCountry > 0 || country.id === CAREER_MISSIONS[0].id || previousCountryComplete;
            
            return (
              <button
                key={country.id}
                onClick={() => {
                  if (canPlayCountry) {
                    setSelectedCountry(country.id);
                    setScreen('missionSelect');
                    tennisAudio.click();
                  } else {
                    tennisAudio.error();
                  }
                }}
                disabled={!canPlayCountry}
                className={`w-full p-4 rounded-2xl text-left transition-all ${
                  canPlayCountry
                    ? 'shadow-lg transform hover:scale-105 active:scale-95'
                    : 'opacity-60 grayscale'
                }`}
                style={{
                  background: canPlayCountry
                    ? `linear-gradient(135deg, rgba(100,150,200,0.8), rgba(80,120,180,0.8))`
                    : 'linear-gradient(135deg, rgba(60,60,60,0.6), rgba(40,40,40,0.6))',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{country.flag}</span>
                      <div className="flex-1">
                        <div className="font-bold text-white">{country.name}</div>
                        <div className="text-[10px] text-white/70">{country.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-white/20 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-300 to-orange-400 h-full transition-all"
                          style={{ width: `${(completedInCountry / countryMissions.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/80 font-semibold">{completedInCountry}/5</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {isCountryComplete && <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />}
                    {!canPlayCountry && <Lock className="h-5 w-5 text-white/40" />}
                    {canPlayCountry && !isCountryComplete && <Unlock className="h-5 w-5 text-green-400" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMissionSelect = () => {
    const country = getCountryById(selectedCountry || '');
    if (!country) return null;

    const heroLevel = progress.heroUpgradeLevel[selectedHeroId] || 1;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 overflow-auto">
        <Button
          onClick={() => { setScreen('countrySelect'); tennisAudio.click(); }}
          variant="ghost"
          className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="mt-6 text-center">
          <div className="text-5xl mb-2">{country.flag}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{country.name}</h2>
          <p className="text-white/60 text-xs mb-4">Complete all 5 matches to master this country</p>
        </div>

        {/* Hero Power Level Info */}
        <div className="w-full max-w-md mb-6 px-2">
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-300 text-sm font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" /> Hero Power Level
              </span>
              <span className="text-white font-bold text-lg">{heroLevel}/8</span>
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full transition-all"
                style={{ width: `${(heroLevel / 8) * 100}%` }}
              />
            </div>
            <p className="text-blue-300/80 text-xs mt-2">Upgrade your hero to unlock harder missions</p>
          </div>
        </div>

        {/* Mission List */}
        <div className="w-full max-w-md space-y-2.5 px-2">
          {country.matches.map((mission, index) => {
            const isCompleted = progress.completedMissions.includes(mission.id);
            const isPreviousCompleted = index === 0 || progress.completedMissions.includes(country.matches[index - 1].id);
            const isUnlocked = isPreviousCompleted;
            const canPlay = isUnlocked && heroLevel >= mission.requiredPowerLevel;
            
            return (
              <button
                key={mission.id}
                onClick={() => {
                  if (canPlay || isCompleted) {
                    setSelectedMission(mission);
                    setSelectedCourt(mission.difficulty); // Use mission difficulty as court level
                    tennisAudio.click();
                    // Directly start the game without court select screen
                    setTimeout(() => startGame(), 100);
                  } else if (!isUnlocked) {
                    tennisAudio.error();
                  } else if (heroLevel < mission.requiredPowerLevel) {
                    setShowUpgradePrompt(true);
                    tennisAudio.error();
                  }
                }}
                disabled={!canPlay && !isCompleted}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  (canPlay || isCompleted) && 'hover:scale-102 active:scale-98'
                }`}
                style={{
                  background: isCompleted
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(22,163,74,0.3))'
                    : canPlay
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.3))'
                    : 'linear-gradient(135deg, rgba(60,60,60,0.4), rgba(40,40,40,0.4))',
                  opacity: (canPlay || isCompleted) ? 1 : 0.6,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-white">Match {mission.matchNumber}</div>
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded">Lvl {mission.difficulty}</span>
                      {mission.requiredPowerLevel > 1 && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {mission.requiredPowerLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/70 mt-1">{mission.opponentName}</p>
                    <p className="text-[11px] text-white/50">{mission.description}</p>
                  </div>
                  <div className="text-right">
                    {isCompleted ? (
                      <div className="flex flex-col items-center gap-1">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-yellow-400 font-bold">{mission.reward}</span>
                      </div>
                    ) : !isUnlocked ? (
                      <Lock className="h-5 w-5 text-white/40" />
                    ) : heroLevel < mission.requiredPowerLevel ? (
                      <div className="text-xs text-orange-400 font-bold">Upgrade</div>
                    ) : (
                      <div className="text-right">
                        <Unlock className="h-5 w-5 text-green-400 mx-auto" />
                        <span className="text-xs text-yellow-300 font-bold mt-1">+{mission.reward}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
            <div className="bg-slate-800 border border-white/10 rounded-xl p-6 max-w-xs mx-4 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-white font-bold mb-2">Power Upgrade Required</h3>
              <p className="text-white/70 text-sm mb-4">Your hero needs to be upgraded to Power Level {heroLevel + 1} to unlock this mission</p>
              <Button
                onClick={() => setShowUpgradePrompt(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Got It
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderModeSelect = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-4 overflow-auto">
      <Button
        onClick={() => { setScreen('menu'); tennisAudio.click(); }}
        variant="ghost"
        className="absolute top-3 left-3 text-white/80 hover:text-white hover:bg-white/10"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      
      <h2 className="text-2xl font-bold text-white mb-2 mt-6">Select Mode</h2>
      <p className="text-white/70 text-xs text-center mb-6 max-w-xs">Each mode offers a unique experience</p>
      
      <div className="w-full max-w-md space-y-3 px-2">
        {/* Career Mode */}
        <button
          onClick={() => {
            setGameMode('career');
            setSelectedCountry(null);
            setSelectedMission(null);
            setScreen('countrySelect');
            tennisAudio.click();
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all border border-white/20 text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏆</span>
                <div className="font-bold text-lg">Career Mode</div>
              </div>
              <p className="text-[11px] opacity-90 mb-2">Progress through 8 courts • Unlock achievements • Build your legacy</p>
              <div className="text-[10px] opacity-75">
                <div>✓ 8 Progressive Courts</div>
                <div>✓ Ranked Opponents</div>
                <div>✓ Save Your Progress</div>
              </div>
            </div>
            <div className="text-3xl">→</div>
          </div>
        </button>

        {/* Quick Play Mode */}
        <button
          onClick={() => {
            setGameMode('quickMatch');
            setScreen('courtSelect');
            tennisAudio.click();
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all border border-white/20 text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⚡</span>
                <div className="font-bold text-lg">Quick Play</div>
              </div>
              <p className="text-[11px] opacity-90 mb-2">Play any court instantly • Random difficulty • No progression</p>
              <div className="text-[10px] opacity-75">
                <div>✓ Play Any Court</div>
                <div>✓ Quick Matches</div>
                <div>✓ Earn Coins Fast</div>
              </div>
            </div>
            <div className="text-3xl">→</div>
          </div>
        </button>

        {/* Practice Mode */}
        <button
          onClick={() => {
            setGameMode('practice');
            setScreen('courtSelect');
            tennisAudio.click();
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all border border-white/20 text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎯</span>
                <div className="font-bold text-lg">Practice Mode</div>
              </div>
              <p className="text-[11px] opacity-90 mb-2">Master your skills • Weaker AI • No time limit • No pressure</p>
              <div className="text-[10px] opacity-75">
                <div>✓ All Courts Unlocked</div>
                <div>✓ Easy AI (Always)</div>
                <div>✓ No Coin Penalty</div>
              </div>
            </div>
            <div className="text-3xl">→</div>
          </div>
        </button>

        {/* Challenge Mode */}
        <button
          onClick={() => {
            setGameMode('challenge');
            setScreen('courtSelect');
            tennisAudio.click();
          }}
          className="w-full p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg transform hover:scale-105 active:scale-95 transition-all border border-white/20 text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🔥</span>
                <div className="font-bold text-lg">Challenge Mode</div>
              </div>
              <p className="text-[11px] opacity-90 mb-2">Extreme difficulty • Time based • Win big rewards • Lose big coins</p>
              <div className="text-[10px] opacity-75">
                <div>✓ Hardest AI</div>
                <div>✓ Time Limit (5 min)</div>
                <div>✓ 3x Coin Rewards</div>
              </div>
            </div>
            <div className="text-3xl">→</div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderCourtSelect = () => {
    // Filter courts based on mode
    const getAvailableCourts = () => {
      if (gameMode === 'practice') {
        return COURTS; // All courts in practice
      } else if (gameMode === 'quickMatch') {
        return COURTS; // All courts in quick play
      } else if (gameMode === 'challenge') {
        return COURTS.slice(3); // Only courts 4+ for challenge
      } else {
        // Career: only unlocked courts
        return COURTS.filter(c => c.unlockLevel <= progress.highestLevel);
      }
    };

    const availableCourts = getAvailableCourts();
    const modeInfo = {
      career: { title: '📈 Career - Select Your Next Court', color: 'from-amber-500 to-orange-600' },
      quickMatch: { title: '⚡ Quick Play - Choose Any Court', color: 'from-cyan-500 to-blue-600' },
      practice: { title: '🎯 Practice - Perfect Your Skills', color: 'from-emerald-500 to-green-600' },
      challenge: { title: '🔥 Challenge - Extreme Mode', color: 'from-rose-500 to-red-600' },
    };
    
    const info = modeInfo[gameMode];

    return (
      <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="flex items-center p-3 border-b border-white/10">
          <Button
            onClick={() => { setScreen('modeSelect'); tennisAudio.click(); }}
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold flex-1 text-center pr-8">{info.title}</h2>
        </div>

        {/* Mode Info Bar */}
        <div className={`bg-gradient-to-r ${info.color} px-4 py-3 text-white/90 text-xs`}>
          {gameMode === 'career' && <div>🎓 Progress through courts to unlock the next level. Your best effort counts!</div>}
          {gameMode === 'quickMatch' && <div>⚡ Play without restrictions. Earn coins instantly with no progression tracking.</div>}
          {gameMode === 'practice' && <div>🎯 Train freely with weak AI. Perfect for learning shot placement and timing!</div>}
          {gameMode === 'challenge' && <div>🔥 5-minute match timer! Win for 3x coins. Lose and no rewards. High stakes!</div>}
        </div>
        
        <div className="flex-1 overflow-auto p-3 space-y-2.5">
          {availableCourts.map(court => {
            const unlocked = gameMode === 'practice' || gameMode === 'quickMatch' || court.unlockLevel <= progress.highestLevel;
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
                      {gameMode === 'practice' && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/30 rounded-full">
                          Easy AI
                        </span>
                      )}
                      {gameMode === 'challenge' && (
                        <span className="text-[10px] px-2 py-0.5 bg-red-500/30 rounded-full">
                          Hard AI
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
  };

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

  const renderMatchEnd = () => {
    const nextUpgradeCost = 100 + (heroUpgradeLevel * 50); // Cost increases per level
    const canUpgrade = progress.coins >= nextUpgradeCost && heroUpgradeLevel < 8;
    const nextMissionToPlay = matchResult?.won ? getNextMissionToPlay() : null;
    
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white p-4 overflow-auto">
        <div className="text-center mb-5 mt-6">
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

        {/* Hero Upgrade Option (Career Mode) */}
        {gameMode === 'career' && matchResult?.won && heroUpgradeLevel < 8 && (
          <div className="w-full max-w-xs mb-5 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="font-bold">Hero Power Upgrade</span>
              </div>
              <span className="text-xs bg-purple-600 px-2 py-1 rounded">{heroUpgradeLevel}/8</span>
            </div>
            <div className="w-full bg-purple-900/50 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-400 to-blue-400 h-full"
                style={{ width: `${(heroUpgradeLevel / 8) * 100}%` }}
              />
            </div>
            <p className="text-xs text-white/70 mb-3">Upgrade to unlock harder missions and increase hero stats</p>
            <Button
              onClick={() => {
                if (storage.upgradeHeroPower(selectedHeroId, nextUpgradeCost)) {
                  setHeroUpgradeLevel(heroUpgradeLevel + 1);
                  const updatedProgress = storage.get();
                  setProgress(updatedProgress);
                  tennisAudio.click();
                }
              }}
              disabled={!canUpgrade}
              className={`w-full h-10 font-bold rounded-lg transition-all ${
                canUpgrade
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                  : 'bg-white/10 opacity-50 cursor-not-allowed'
              }`}
            >
              {canUpgrade ? (
                <>
                  <Zap className="mr-2 h-4 w-4 inline" />
                  Upgrade ({nextUpgradeCost} 💰)
                </>
              ) : heroUpgradeLevel >= 8 ? (
                '✓ Max Level Reached'
              ) : (
                `Need ${nextUpgradeCost - progress.coins} more coins`
              )}
            </Button>
          </div>
        )}
        
        <div className={`flex gap-3 w-full max-w-xs ${gameMode === 'career' && matchResult?.won && nextMissionToPlay ? 'flex-col' : ''}`}>
          <div className="flex gap-3 w-full">
            <Button 
              onClick={startGame} 
              className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold"
            >
              <Play className="mr-2 h-5 w-5" /> Replay
            </Button>
            <Button 
              onClick={() => {
                if (gameMode === 'career') {
                  setScreen('missionSelect');
                } else {
                  setScreen('menu');
                }
              }} 
              className="flex-1 h-12 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20"
            >
              <Home className="mr-2 h-5 w-5" /> {gameMode === 'career' ? 'Back' : 'Menu'}
            </Button>
          </div>
          {gameMode === 'career' && matchResult?.won && nextMissionToPlay && (
            <Button 
              onClick={() => {
                setSelectedMission(nextMissionToPlay);
                setSelectedCourt(nextMissionToPlay.difficulty);
                tennisAudio.click();
                setTimeout(() => startGame(), 100);
              }} 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 rounded-xl font-bold"
            >
              <ChevronRight className="mr-2 h-5 w-5" /> Next Mission
            </Button>
          )}
        </div>
      </div>
    );
  };

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
          {screen === 'countrySelect' && renderCountrySelect()}
          {screen === 'missionSelect' && renderMissionSelect()}
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
                onClick={(e) => {
                  if (gameStateRef.current?.slowMotionActive) {
                    handleCanvasClick(e);
                  } else {
                    handleInput();
                  }
                }}
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
              
              {/* Slow Motion UI */}
              {gameStateRef.current?.slowMotionActive && gameStateRef.current?.clickToHitActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-20 pointer-events-none">
                  <div className="text-center">
                    <div className="text-5xl font-black text-white mb-4" style={{ textShadow: '0 0 20px rgba(255,215,0,0.8)' }}>
                      ⏱️
                    </div>
                    <div className="text-2xl font-bold text-yellow-300 mb-3">SLOW MOTION</div>
                    <div className="text-white/90 mb-6">
                      <span className="text-3xl font-black">
                        {Math.max(0.0, ((gameStateRef.current.slowMotionStartTime + gameStateRef.current.slowMotionDuration - performance.now()) / 1000)).toFixed(1)}s
                      </span>
                    </div>
                    <div className="text-white/70 text-sm">Click to hit the ball!</div>
                    
                    {/* Target reticle if cursor is over canvas */}
                    {gameStateRef.current.targetClickPos && (
                      <div
                        className="absolute w-6 h-6 border-2 border-yellow-300 rounded-full pointer-events-none"
                        style={{
                          left: `${(gameStateRef.current.targetClickPos.x / CANVAS_WIDTH) * 100}%`,
                          top: `${(gameStateRef.current.targetClickPos.y / CANVAS_HEIGHT) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              
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
