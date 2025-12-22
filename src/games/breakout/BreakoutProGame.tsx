import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Volume2, VolumeX, Pause, Play, Home, RotateCcw, Lock, Unlock, ChevronLeft, ChevronRight, Trophy, Star, Trash2, SkipForward } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { Ball, Brick, Paddle, Particle, PowerUp, PowerUpType, GameScreen, GameState } from './types';
import { LEVELS, getTotalLevels } from './levels';
import { loadProgress, saveProgress, updateBestScore, unlockLevel, resetProgress, incrementStats } from './storage';
import { audioManager } from './audio';
import { Renderer } from './renderer';

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 700;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 14;
const BALL_RADIUS = 8;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 24;
const BRICK_GAP = 4;
const BRICK_OFFSET_TOP = 60;
const POWERUP_SPEED = 2;
const POWERUP_DURATION = 10000;

const BreakoutProGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const rendererRef = useRef<Renderer | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    screen: 'menu',
    score: 0,
    lives: 3,
    level: 1,
    combo: 0,
    activePowerUps: [],
  });

  // Game objects refs for game loop
  const ballsRef = useRef<Ball[]>([]);
  const paddleRef = useRef<Paddle>({ x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 40, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, targetX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 });
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const gameStateRef = useRef(gameState);
  const bricksDestroyedRef = useRef(0);

  // Progress
  const [progress, setProgress] = useState(loadProgress());

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    audioManager.setEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not found');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D canvas context');
      return;
    }
    console.log('Canvas initialized:', { width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    rendererRef.current = new Renderer(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  // Get theme name based on level
  const getThemeName = useCallback((levelNum: number): string => {
    const themeIndex = Math.floor((levelNum - 1) / 5);
    const themes = ['NEON', 'METAL', 'CRYSTAL', 'LAVA', 'CYBER', 'COSMIC'];
    return themes[Math.min(themeIndex, themes.length - 1)];
  }, []);

  // Get theme key based on level
  const getThemeKey = useCallback((levelNum: number): 'neon' | 'metal' | 'crystal' | 'lava' | 'cyber' | 'cosmic' => {
    const themeIndex = Math.floor((levelNum - 1) / 5);
    const themes: ('neon' | 'metal' | 'crystal' | 'lava' | 'cyber' | 'cosmic')[] = ['neon', 'metal', 'crystal', 'lava', 'cyber', 'cosmic'];
    return themes[Math.min(themeIndex, themes.length - 1)];
  }, []);

  // Create bricks from level
  const createBricks = useCallback((levelNum: number): Brick[] => {
    const level = LEVELS[levelNum - 1];
    if (!level) return [];

    const bricks: Brick[] = [];
    const layout = level.layout;
    const startX = (CANVAS_WIDTH - (layout[0].length * (BRICK_WIDTH + BRICK_GAP))) / 2;
    const theme = getThemeKey(levelNum);

    layout.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 0) return;

        let type: Brick['type'] = 'normal';
        let health = 1;
        const color = '#4fd1c5';
        const glowColor = '#4fd1c540';

        switch (cell) {
          case 1:
            type = 'normal';
            health = 1;
            break;
          case 2:
            type = 'strong';
            health = 3; // Changed to 3-hit system
            break;
          case 3:
            type = 'strong';
            health = 3;
            break;
          case 4:
            type = 'unbreakable';
            health = 999;
            break;
          case 5:
            type = 'explosive';
            health = 1;
            break;
          case 6:
            type = 'powerup';
            health = 1;
            break;
        }

        bricks.push({
          x: startX + colIndex * (BRICK_WIDTH + BRICK_GAP),
          y: BRICK_OFFSET_TOP + rowIndex * (BRICK_HEIGHT + BRICK_GAP),
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          visible: true,
          health,
          maxHealth: health,
          type,
          color,
          glowColor,
          damageLevel: 0,
          theme,
        });
      });
    });

    return bricks;
  }, [getThemeKey]);

  // Create particles
  const createParticles = useCallback((x: number, y: number, color: string, count: number = 10) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        x,
        y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 3 + Math.random() * 4,
      });
    }
    particlesRef.current.push(...newParticles);
  }, []);

  // Spawn power-up
  const spawnPowerUp = useCallback((x: number, y: number) => {
    const types: PowerUpType[] = ['multiball', 'widePaddle', 'slowMotion', 'fireball', 'extraLife'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUpsRef.current.push({ x, y, type, active: true });
  }, []);

  // Initialize/reset ball
  const resetBall = useCallback((): Ball => {
    const level = LEVELS[gameStateRef.current.level - 1];
    const speed = level?.ballSpeed || 4;
    const angle = -Math.PI / 4 - Math.random() * Math.PI / 2;
    return {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: BALL_RADIUS,
      trail: [],
    };
  }, []);

  // Start level
  const startLevel = useCallback((levelNum: number) => {
    bricksRef.current = createBricks(levelNum);
    ballsRef.current = [resetBall()];
    paddleRef.current = { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - 40, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, targetX: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2 };
    particlesRef.current = [];
    powerUpsRef.current = [];
    bricksDestroyedRef.current = 0;

    setGameState(prev => ({
      ...prev,
      screen: 'playing',
      level: levelNum,
      lives: 3,
      combo: 0,
      activePowerUps: [],
    }));

    saveProgress({ currentLevel: levelNum });
    audioManager.countdownGo();
  }, [createBricks, resetBall]);

  // Handle brick hit - with 3-hit visual damage system
  const handleBrickHit = useCallback((brick: Brick, ballIndex: number) => {
    if (brick.type === 'unbreakable') {
      audioManager.brickDamage();
      return;
    }

    brick.health--;
    
    // Update damage level for visual feedback (3-hit system)
    if (brick.type !== 'powerup' && brick.type !== 'explosive') {
      const damageStage = brick.maxHealth - brick.health;
      brick.damageLevel = Math.min(damageStage, 2); // 0, 1, or 2 (3rd hit destroys)
    }

    if (brick.health <= 0) {
      brick.visible = false;
      bricksDestroyedRef.current++;

      const comboBonus = Math.min(gameStateRef.current.combo, 10);
      const points = 10 * (1 + comboBonus * 0.1);
      
      setGameState(prev => ({
        ...prev,
        score: Math.floor(prev.score + points),
        combo: prev.combo + 1,
      }));

      createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 15);
      audioManager.brickBreak(gameStateRef.current.combo);
      rendererRef.current?.shake(3);

      // Handle explosive
      if (brick.type === 'explosive') {
        audioManager.explosion();
        rendererRef.current?.shake(8);
        createParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff6600', 30);
        
        // Destroy nearby bricks
        bricksRef.current.forEach(other => {
          if (other.visible && other !== brick && other.type !== 'unbreakable') {
            const dist = Math.hypot(other.x - brick.x, other.y - brick.y);
            if (dist < 100) {
              other.visible = false;
              other.health = 0;
              other.damageLevel = 2;
              bricksDestroyedRef.current++;
              createParticles(other.x + other.width / 2, other.y + other.height / 2, '#ff6600', 8);
              setGameState(prev => ({ ...prev, score: prev.score + 10 }));
            }
          }
        });
      }

      // Spawn power-up
      if (brick.type === 'powerup') {
        spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
      }
    } else {
      audioManager.brickDamage();
    }
  }, [createParticles, spawnPowerUp]);

  // Check for level complete
  const checkLevelComplete = useCallback(() => {
    const breakableBricks = bricksRef.current.filter(b => b.type !== 'unbreakable');
    if (breakableBricks.every(b => !b.visible)) {
      audioManager.levelComplete();
      updateBestScore(gameStateRef.current.score);
      incrementStats(bricksDestroyedRef.current);
      
      const nextLevel = gameStateRef.current.level + 1;
      if (nextLevel <= getTotalLevels()) {
        unlockLevel(nextLevel);
        setProgress(loadProgress());
      }
      
      setGameState(prev => ({ ...prev, screen: 'levelComplete' }));
    }
  }, []);

  // Handle life lost
  const handleLifeLost = useCallback(() => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      if (newLives <= 0) {
        audioManager.gameOver();
        updateBestScore(prev.score);
        incrementStats(bricksDestroyedRef.current);
        setProgress(loadProgress());
        return { ...prev, lives: 0, screen: 'gameOver' };
      }
      audioManager.lifeLost();
      return { ...prev, lives: newLives, combo: 0 };
    });
    
    if (gameStateRef.current.lives > 1) {
      ballsRef.current = [resetBall()];
    }
  }, [resetBall]);

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const renderer = rendererRef.current;
    if (!renderer) {
      console.warn('Renderer not initialized in gameLoop');
      return;
    }

    renderer.update(deltaTime);
    renderer.clear();

    const state = gameStateRef.current;
    const isPlaying = state.screen === 'playing';
    const currentTime = Date.now();

    // Clean up expired power-ups
    setGameState(prev => ({
      ...prev,
      activePowerUps: prev.activePowerUps.filter(p => p.endTime > currentTime),
    }));

    const hasWidePaddle = state.activePowerUps.some(p => p.type === 'widePaddle' && p.endTime > currentTime);
    const hasSlowMotion = state.activePowerUps.some(p => p.type === 'slowMotion' && p.endTime > currentTime);
    const hasFireball = state.activePowerUps.some(p => p.type === 'fireball' && p.endTime > currentTime);

    // Update paddle
    const paddle = paddleRef.current;
    paddle.x += (paddle.targetX - paddle.x) * 0.2;

    if (isPlaying) {
      // Update balls
      const speedMultiplier = hasSlowMotion ? 0.5 : 1;
      
      ballsRef.current.forEach((ball, ballIndex) => {
        // Add trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 10) ball.trail.shift();

        ball.x += ball.dx * speedMultiplier;
        ball.y += ball.dy * speedMultiplier;

        // Wall collisions
        if (ball.x <= ball.radius || ball.x >= CANVAS_WIDTH - ball.radius) {
          ball.dx = -ball.dx;
          ball.x = Math.max(ball.radius, Math.min(CANVAS_WIDTH - ball.radius, ball.x));
          audioManager.wallHit();
        }
        if (ball.y <= ball.radius) {
          ball.dy = Math.abs(ball.dy);
          ball.y = ball.radius;
          audioManager.wallHit();
        }

        // Paddle collision - improved detection
        const paddleWidth = hasWidePaddle ? paddle.width * 1.5 : paddle.width;
        const paddleX = hasWidePaddle ? paddle.x - (paddleWidth - paddle.width) / 2 : paddle.x;
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + paddle.height;
        
        // Check if ball is moving downward and in paddle zone
        if (ball.dy > 0) {
          // Previous position check to prevent tunneling
          const prevY = ball.y - ball.dy * speedMultiplier;
          const ballBottom = ball.y + ball.radius;
          const prevBallBottom = prevY + ball.radius;
          
          // Check if ball crossed paddle top between frames
          const crossedPaddleTop = prevBallBottom <= paddleTop && ballBottom >= paddleTop;
          const isWithinPaddle = ballBottom >= paddleTop && ball.y - ball.radius <= paddleBottom;
          
          if ((crossedPaddleTop || isWithinPaddle) && 
              ball.x + ball.radius >= paddleX && 
              ball.x - ball.radius <= paddleX + paddleWidth) {
            
            // Calculate hit position (0 = left edge, 1 = right edge)
            const hitPos = Math.max(0, Math.min(1, (ball.x - paddleX) / paddleWidth));
            
            // Calculate bounce angle (-60 to +60 degrees from vertical)
            const maxAngle = Math.PI / 3; // 60 degrees
            const angle = (hitPos - 0.5) * 2 * maxAngle;
            
            // Maintain or slightly increase speed
            const currentSpeed = Math.hypot(ball.dx, ball.dy);
            const newSpeed = Math.min(currentSpeed * 1.02, 12); // Cap max speed
            
            // Apply new velocity
            ball.dx = Math.sin(angle) * newSpeed;
            ball.dy = -Math.abs(Math.cos(angle) * newSpeed); // Always go up
            
            // Ensure minimum upward velocity
            if (ball.dy > -2) ball.dy = -2;
            
            // Reposition ball above paddle
            ball.y = paddleTop - ball.radius - 1;
            
            audioManager.paddleHit();
            setGameState(prev => ({ ...prev, combo: 0 }));
          }
        }

        // Brick collisions - improved to prevent ball getting stuck
        let hasBouncedX = false;
        let hasBouncedY = false;
        const hitBricks: typeof bricksRef.current = [];
        
        bricksRef.current.forEach(brick => {
          if (!brick.visible) return;

          // Check collision
          if (
            ball.x + ball.radius > brick.x &&
            ball.x - ball.radius < brick.x + brick.width &&
            ball.y + ball.radius > brick.y &&
            ball.y - ball.radius < brick.y + brick.height
          ) {
            hitBricks.push(brick);
          }
        });

        // Process hit bricks - only bounce once even if multiple bricks hit
        hitBricks.forEach((brick, hitIndex) => {
          handleBrickHit(brick, ballIndex);

          // Only calculate bounce for first brick hit (prevents stuck ball)
          if (!hasFireball && hitIndex === 0) {
            // Calculate previous position
            const prevX = ball.x - ball.dx * speedMultiplier;
            const prevY = ball.y - ball.dy * speedMultiplier;
            
            // Determine which side was crossed
            const wasLeftOf = prevX + ball.radius <= brick.x;
            const wasRightOf = prevX - ball.radius >= brick.x + brick.width;
            const wasAbove = prevY + ball.radius <= brick.y;
            const wasBelow = prevY - ball.radius >= brick.y + brick.height;

            // Bounce based on entry direction
            if ((wasLeftOf || wasRightOf) && !hasBouncedX) {
              ball.dx = -ball.dx;
              hasBouncedX = true;
              // Push ball out of brick
              if (wasLeftOf) ball.x = brick.x - ball.radius - 1;
              else ball.x = brick.x + brick.width + ball.radius + 1;
            } else if ((wasAbove || wasBelow) && !hasBouncedY) {
              ball.dy = -ball.dy;
              hasBouncedY = true;
              // Push ball out of brick
              if (wasAbove) ball.y = brick.y - ball.radius - 1;
              else ball.y = brick.y + brick.height + ball.radius + 1;
            } else if (!hasBouncedX && !hasBouncedY) {
              // Fallback: use overlap method but only once
              const overlapLeft = ball.x + ball.radius - brick.x;
              const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
              const overlapTop = ball.y + ball.radius - brick.y;
              const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

              const minOverlapX = Math.min(overlapLeft, overlapRight);
              const minOverlapY = Math.min(overlapTop, overlapBottom);

              if (minOverlapX < minOverlapY) {
                ball.dx = -ball.dx;
                hasBouncedX = true;
                ball.x += ball.dx > 0 ? minOverlapX + 1 : -(minOverlapX + 1);
              } else {
                ball.dy = -ball.dy;
                hasBouncedY = true;
                ball.y += ball.dy > 0 ? minOverlapY + 1 : -(minOverlapY + 1);
              }
            }
          }
        });

        // Ensure ball has minimum velocity to prevent getting stuck
        const minVelocity = 2;
        if (Math.abs(ball.dx) < minVelocity && Math.abs(ball.dy) < minVelocity) {
          const speed = Math.hypot(ball.dx, ball.dy);
          if (speed > 0) {
            const scale = minVelocity / speed;
            ball.dx *= scale * 1.5;
            ball.dy *= scale * 1.5;
          } else {
            ball.dy = -minVelocity * 2;
          }
        }

        // Ball lost
        if (ball.y > CANVAS_HEIGHT + ball.radius) {
          ballsRef.current.splice(ballIndex, 1);
          if (ballsRef.current.length === 0) {
            handleLifeLost();
          }
        }
      });

      // Update power-ups
      powerUpsRef.current.forEach((powerUp, index) => {
        if (!powerUp.active) return;

        powerUp.y += POWERUP_SPEED;

        // Collision with paddle
        if (
          powerUp.y + 10 >= paddle.y &&
          powerUp.x >= paddleRef.current.x &&
          powerUp.x <= paddleRef.current.x + paddle.width
        ) {
          powerUp.active = false;
          audioManager.powerUp();

          if (powerUp.type === 'multiball') {
            const newBalls = ballsRef.current.flatMap(ball => [
              { ...ball, dx: ball.dx + 2, trail: [] },
              { ...ball, dx: ball.dx - 2, trail: [] },
            ]);
            ballsRef.current.push(...newBalls);
          } else if (powerUp.type === 'extraLife') {
            setGameState(prev => ({ ...prev, lives: Math.min(prev.lives + 1, 5) }));
          } else {
            setGameState(prev => ({
              ...prev,
              activePowerUps: [...prev.activePowerUps, { type: powerUp.type, endTime: currentTime + POWERUP_DURATION }],
            }));
          }
        }

        // Remove if off screen
        if (powerUp.y > CANVAS_HEIGHT + 20) {
          powerUp.active = false;
        }
      });

      // Clean up inactive power-ups
      powerUpsRef.current = powerUpsRef.current.filter(p => p.active);

      // Update particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.1; // Gravity
        p.life -= deltaTime * 2;
        return p.life > 0;
      });

      // Check level complete
      checkLevelComplete();
    }

    // Render
    const currentTheme = getThemeKey(state.level);
    const themeName = getThemeName(state.level);
    rendererRef.current?.setTheme(currentTheme);
    bricksRef.current.forEach(brick => renderer.drawBrick(brick));
    powerUpsRef.current.forEach(powerUp => renderer.drawPowerUp(powerUp));
    particlesRef.current.forEach(particle => renderer.drawParticle(particle));
    renderer.drawPaddle(paddle, hasWidePaddle);
    ballsRef.current.forEach(ball => renderer.drawBall(ball, hasFireball));
    renderer.drawUI(state.score, state.lives, state.level, state.combo, state.activePowerUps, currentTime, themeName);
    renderer.restore();

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [checkLevelComplete, handleBrickHit, handleLifeLost, getThemeKey, getThemeName]);

  // Start game loop
  useEffect(() => {
    if (gameState.screen === 'playing' || gameState.screen === 'paused') {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [gameState.screen, gameLoop]);

  // Mouse/touch controls
  useEffect(() => {
    const handleMove = (clientX: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const x = (clientX - rect.left) * scaleX;
      paddleRef.current.targetX = Math.max(0, Math.min(CANVAS_WIDTH - paddleRef.current.width, x - paddleRef.current.width / 2));
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p') {
        if (gameState.screen === 'playing') {
          setGameState(prev => ({ ...prev, screen: 'paused' }));
        } else if (gameState.screen === 'paused') {
          setGameState(prev => ({ ...prev, screen: 'playing' }));
        }
      }
      if (e.key === ' ' && gameState.screen === 'menu') {
        startLevel(progress.currentLevel);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.screen, startLevel, progress.currentLevel]);

  const toggleSound = () => {
    const newEnabled = !progress.soundEnabled;
    setProgress(prev => ({ ...prev, soundEnabled: newEnabled }));
    saveProgress({ soundEnabled: newEnabled });
    audioManager.setEnabled(newEnabled);
    if (newEnabled) audioManager.menuClick();
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      resetProgress();
      setProgress(loadProgress());
      audioManager.menuClick();
    }
  };

  const handleSkipLevel = () => {
    const nextLevel = gameState.level + 1;
    if (nextLevel <= getTotalLevels()) {
      // Unlock the next level
      unlockLevel(nextLevel);
      setProgress(loadProgress());
      audioManager.levelComplete();
      startLevel(nextLevel);
    } else {
      // Already at last level, go to menu
      setGameState(prev => ({ ...prev, screen: 'menu', score: 0 }));
    }
  };

  // Render screens
  const renderScreen = () => {
    switch (gameState.screen) {
      case 'menu':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur-sm overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-72 h-72 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <h1 className="text-7xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
                BREAKOUT PRO
              </h1>
              <div className="h-1 w-64 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-8" />
              <p className="text-lg text-gray-400 mb-12 tracking-widest">MASTER OF BLOCKS</p>
              
              <div className="flex flex-col gap-4 w-80">
                <button
                  onClick={() => startLevel(progress.currentLevel)}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50 border border-cyan-400/30"
                >
                  <Play className="h-6 w-6" />
                  Continue Level {progress.currentLevel}
                </button>
                
                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))}
                  className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50 border border-purple-400/30"
                >
                  Select Level
                </button>

                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-all border border-slate-700"
                >
                  <Unlock className="h-4 w-4" />
                  Unlocked: {progress.highestUnlockedLevel} / {getTotalLevels()}
                </button>
              </div>

              <div className="mt-12 flex flex-col items-center gap-4 text-sm">
                <div className="flex items-center gap-3 px-6 py-2 rounded-lg bg-slate-800/50 border border-yellow-500/30">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-yellow-400">Best Score: <span className="font-bold">{progress.bestScore.toLocaleString()}</span></span>
                </div>
                <div className="flex items-center gap-3 px-6 py-2 rounded-lg bg-slate-800/50 border border-purple-500/30">
                  <Star className="h-5 w-5 text-purple-500" />
                  <span className="text-purple-400">Games Played: <span className="font-bold">{progress.totalGamesPlayed}</span></span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 flex gap-4">
              <button
                onClick={toggleSound}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-cyan-400"
                title={progress.soundEnabled ? 'Mute' : 'Unmute'}
              >
                {progress.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              <button
                onClick={handleResetProgress}
                className="p-3 rounded-full bg-slate-800 hover:bg-red-900 transition-colors border border-slate-700 text-red-400"
                title="Reset Progress"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        );

      case 'levelSelect': {
        // Group levels by theme
        const themes = ['NEON', 'METAL', 'CRYSTAL', 'LAVA', 'CYBER', 'COSMIC'];
        const themeColors: Record<string, string> = {
          NEON: 'from-cyan-500 to-purple-500',
          METAL: 'from-gray-400 to-yellow-600',
          CRYSTAL: 'from-blue-400 to-cyan-300',
          LAVA: 'from-orange-500 to-red-600',
          CYBER: 'from-green-400 to-cyan-500',
          COSMIC: 'from-purple-600 to-pink-500',
        };

        return (
          <div className="absolute inset-0 flex flex-col items-center justify-start bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur-sm overflow-y-auto p-6">
            <button
              onClick={() => setGameState(prev => ({ ...prev, screen: 'menu' }))}
              className="absolute top-4 left-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <h2 className="text-5xl font-black mb-2 text-center mt-8 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              SELECT LEVEL
            </h2>
            <div className="h-1 w-48 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mb-8" />
            
            {themes.map((theme, themeIndex) => {
              const themeLevelStart = themeIndex * 5 + 1;
              const themeLevelEnd = Math.min(themeLevelStart + 4, getTotalLevels());
              
              return (
                <div key={theme} className="w-full max-w-5xl mb-8">
                  <div className={`bg-gradient-to-r ${themeColors[theme]} p-0.5 rounded-lg mb-3`}>
                    <div className="bg-slate-900 rounded-lg p-4">
                      <h3 className={`text-xl font-bold bg-gradient-to-r ${themeColors[theme]} bg-clip-text text-transparent`}>
                        {theme} REALM (Levels {themeLevelStart}-{themeLevelEnd})
                      </h3>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: themeLevelEnd - themeLevelStart + 1 }).map((_, i) => {
                      const levelNum = themeLevelStart + i;
                      const level = LEVELS[levelNum - 1];
                      const isUnlocked = levelNum <= progress.highestUnlockedLevel;
                      
                      return (
                        <button
                          key={levelNum}
                          onClick={() => isUnlocked && startLevel(levelNum)}
                          disabled={!isUnlocked}
                          className={`relative group transition-all transform ${
                            isUnlocked
                              ? `bg-gradient-to-br ${themeColors[theme]} text-white hover:scale-110 shadow-lg cursor-pointer`
                              : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                          } p-4 rounded-lg border-2 ${isUnlocked ? 'border-slate-400/50' : 'border-slate-700'}`}
                          title={level?.name}
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-2xl font-black">{levelNum}</div>
                            {isUnlocked && (
                              <div className="text-xs mt-1 text-center truncate">
                                {level?.name.split(' ')[0]}
                              </div>
                            )}
                          </div>
                          
                          {levelNum === progress.currentLevel && isUnlocked && (
                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full animate-pulse shadow-lg" />
                          )}
                          
                          {!isUnlocked && (
                            <Lock className="h-6 w-6 mx-auto text-slate-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="text-center mt-8 mb-4 text-sm text-slate-400">
              Complete levels to unlock new themes!
            </div>
          </div>
        );
      }

      case 'paused':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="relative z-10 text-center">
              <h2 className="text-6xl font-black mb-2 text-cyan-400 drop-shadow-lg">⏸ PAUSED</h2>
              <div className="h-1 w-48 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mx-auto mb-8" />
              
              <div className="flex flex-col gap-4 w-72">
                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'playing' }))}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50"
                >
                  <Play className="h-5 w-5" />
                  Resume
                </button>
                
                <button
                  onClick={() => startLevel(gameState.level)}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700"
                >
                  <RotateCcw className="h-5 w-5" />
                  Restart Level
                </button>
                
                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'menu', score: 0 }))}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all border border-slate-700"
                >
                  <Home className="h-5 w-5" />
                  Main Menu
                </button>
                
                <button
                  onClick={handleSkipLevel}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-600 text-white font-bold hover:from-orange-400 hover:to-yellow-500 transition-all transform hover:scale-105 shadow-2xl shadow-orange-500/50"
                >
                  <SkipForward className="h-5 w-5" />
                  Skip Level
                </button>
              </div>

              <button
                onClick={toggleSound}
                className="mt-8 p-3 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-cyan-400"
              >
                {progress.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
            </div>
          </div>
        );

      case 'gameOver':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-red-950/20 to-slate-950 backdrop-blur-sm">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-7xl font-black mb-4 text-red-500 drop-shadow-lg">GAME OVER</h2>
              <div className="h-1 w-64 bg-gradient-to-r from-red-500 to-orange-500 rounded-full mx-auto mb-8" />
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8">
                <p className="text-sm text-slate-400 mb-2">FINAL SCORE</p>
                <p className="text-5xl font-black text-cyan-400">{gameState.score.toLocaleString()}</p>
                {gameState.score === progress.bestScore && gameState.score > 0 && (
                  <p className="text-2xl text-yellow-400 mt-4 animate-bounce">🏆 New High Score!</p>
                )}
              </div>
              
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => startLevel(gameState.level)}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-2xl shadow-cyan-500/50"
                >
                  <RotateCcw className="h-5 w-5" />
                  Try Again
                </button>
                
                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'menu', score: 0 }))}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50"
                >
                  <Home className="h-5 w-5" />
                  Menu
                </button>
              </div>

              <button
                onClick={() => setGameState(prev => ({ ...prev, screen: 'levelSelect' }))}
                className="text-slate-400 hover:text-slate-200 transition-colors text-sm"
              >
                Select Different Level
              </button>
            </div>
          </div>
        );

      case 'levelComplete': {
        const nextLevel = gameState.level + 1;
        const hasNextLevel = nextLevel <= getTotalLevels();
        const currentThemeName = getThemeName(gameState.level);
        const nextThemeName = getThemeName(nextLevel);
        const isThemeChange = hasNextLevel && currentThemeName !== nextThemeName;
        
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 backdrop-blur-sm">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10 text-center">
              <div className="text-7xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-6xl font-black mb-2 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                LEVEL COMPLETE!
              </h2>
              <div className="h-1 w-64 bg-gradient-to-r from-green-500 to-cyan-500 rounded-full mx-auto mb-8" />
              
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8">
                <p className="text-sm text-slate-400 mb-2">Level {gameState.level}</p>
                <p className="text-2xl font-bold text-white mb-4">{LEVELS[gameState.level - 1]?.name}</p>
                <p className="text-xs text-slate-500 mb-3">{LEVELS[gameState.level - 1]?.description}</p>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent my-4" />
                <p className="text-sm text-slate-400 mb-2">SCORE</p>
                <p className="text-5xl font-black text-cyan-400">{gameState.score.toLocaleString()}</p>
              </div>

              {isThemeChange && hasNextLevel && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 mb-6 border border-purple-400/30">
                  <p className="text-white font-bold text-lg">🌟 NEW THEME UNLOCKED!</p>
                  <p className="text-purple-100 text-sm mt-1">{nextThemeName} Realm Awaits</p>
                </div>
              )}
              
              <div className="flex gap-4 mb-6 flex-wrap justify-center">
                {hasNextLevel ? (
                  <button
                    onClick={() => startLevel(nextLevel)}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-cyan-600 text-white font-bold text-lg hover:from-green-400 hover:to-cyan-500 transition-all transform hover:scale-105 shadow-2xl shadow-green-500/50"
                  >
                    Next Level
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="text-center w-full">
                    <p className="text-3xl text-yellow-400 font-bold mb-2">🏆 Game Complete! 🏆</p>
                    <p className="text-slate-400 mb-6">You've mastered all 30 levels!</p>
                  </div>
                )}
              </div>

              {!hasNextLevel && (
                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'menu', score: 0 }))}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition-all transform hover:scale-105 shadow-2xl shadow-purple-500/50"
                >
                  <Home className="h-5 w-5" />
                  Return to Menu
                </button>
              )}

              {hasNextLevel && (
                <button
                  onClick={() => setGameState(prev => ({ ...prev, screen: 'menu', score: 0 }))}
                  className="text-slate-400 hover:text-slate-200 transition-colors text-sm mt-4"
                >
                  Back to Menu
                </button>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Breakout Pro - Play Free | 5 Minutes Games</title>
        <meta name="description" content="A professional arcade breakout game with multiple levels, power-ups, and stunning visuals. Break all the bricks to advance!" />
      </Helmet>

      <GameLayout
        gameId="breakout"
        title="Breakout Pro"
        score={gameState.score}
        highScore={progress.bestScore}
        isMuted={!progress.soundEnabled}
        onToggleMute={toggleSound}
        showAudioControl
      >
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative rounded-xl overflow-hidden border-2 border-border shadow-2xl shadow-cyan-500/10">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block max-w-full"
              style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
            />
            
            {gameState.screen !== 'playing' && renderScreen()}
            
            {gameState.screen === 'playing' && (
              <button
                onClick={() => setGameState(prev => ({ ...prev, screen: 'paused' }))}
                className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
              >
                <Pause className="h-5 w-5 text-white" />
              </button>
            )}
          </div>

          <p className="text-muted-foreground text-sm mt-4">
            Move mouse or touch to control paddle • Press ESC to pause
          </p>
        </div>
      </GameLayout>
    </>
  );
};

export default BreakoutProGame;
