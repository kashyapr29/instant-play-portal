// Galaxy Rider - Main Game Component

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Trophy, Settings, Volume2, VolumeX, ChevronRight, Star, Lock, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  GameState, GameProgress, PlayerState, Particle, Trail, Block,
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SIZE, GRAVITY, JUMP_FORCE, 
  MOVE_SPEED, MAX_FALL_SPEED, FRICTION, INITIAL_PROGRESS 
} from './types';
import { 
  loadProgress, saveProgress, clearProgress, unlockLevel, 
  saveBestTime, incrementAttempts, incrementDeaths, incrementFinishes, toggleSound 
} from './storage';
import { LEVELS, getLevelById, getTotalLevels } from './levels';
import { Renderer } from './renderer';
import { galaxyAudio } from './audio';

type Screen = 'menu' | 'levels' | 'playing' | 'paused' | 'complete' | 'settings';

export default function GalaxyRiderGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rendererRef = useRef<Renderer | null>(null);
  
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [completedTime, setCompletedTime] = useState<number>(0);
  const [isNewBest, setIsNewBest] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  
  // Game state refs for performance
  const gsRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  
  // Audio setup
  useEffect(() => {
    galaxyAudio.setEnabled(progress.soundEnabled);
  }, [progress.soundEnabled]);
  
  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    rendererRef.current = new Renderer(ctx);
  }, []);
  
  // Calculate stars based on time
  const calculateStars = useCallback((time: number, levelId: number): number => {
    const level = getLevelById(levelId);
    if (!level) return 1;
    const [threeStar, twoStar] = level.starTimes;
    if (time <= threeStar) return 3;
    if (time <= twoStar) return 2;
    return 1;
  }, []);
  
  // Initialize game state
  const initLevel = useCallback((levelId: number) => {
    const level = getLevelById(levelId);
    if (!level) return;
    
    incrementAttempts();
    setProgress(loadProgress());
    
    gsRef.current = {
      screen: 'playing',
      level: levelId,
      time: 0,
      attempts: loadProgress().totalAttempts,
      player: {
        x: level.spawnX,
        y: level.spawnY,
        vx: 0,
        vy: 0,
        rotation: 0,
        isJumping: false,
        isHeavy: false,
        isDead: false,
        isFinished: false,
      },
      particles: [],
      trails: [],
      cameraX: 0,
      cameraY: 0,
      countdown: 3,
      checkpointX: level.spawnX,
      checkpointY: level.spawnY,
      gravityFlipped: false,
    };
    
    setScreen('playing');
    setSelectedLevel(levelId);
  }, []);
  
  // Respawn player
  const respawnPlayer = useCallback(() => {
    if (!gsRef.current) return;
    const gs = gsRef.current;
    const level = getLevelById(gs.level);
    if (!level) return;
    
    incrementDeaths();
    setProgress(loadProgress());
    galaxyAudio.playDeath();
    rendererRef.current?.shake(15);
    
    // Create death particles
    for (let i = 0; i < 20; i++) {
      gs.particles.push({
        x: gs.player.x + PLAYER_SIZE / 2,
        y: gs.player.y + PLAYER_SIZE / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: 5 + Math.random() * 5,
        color: 'rgb(255, 100, 100)',
        life: 30,
        maxLife: 30,
      });
    }
    
    // Reset player to checkpoint
    setTimeout(() => {
      if (!gsRef.current) return;
      gsRef.current.player = {
        x: gs.checkpointX,
        y: gs.checkpointY,
        vx: 0,
        vy: 0,
        rotation: 0,
        isJumping: false,
        isHeavy: false,
        isDead: false,
        isFinished: false,
      };
      gsRef.current.gravityFlipped = false;
    }, 500);
  }, []);
  
  // Complete level
  const completeLevel = useCallback(() => {
    if (!gsRef.current) return;
    const gs = gsRef.current;
    
    incrementFinishes();
    const newBest = saveBestTime(gs.level, gs.time);
    
    // Unlock next level
    if (gs.level < getTotalLevels()) {
      unlockLevel(gs.level + 1);
    }
    
    setProgress(loadProgress());
    setCompletedTime(gs.time);
    setIsNewBest(newBest);
    setEarnedStars(calculateStars(gs.time, gs.level));
    
    galaxyAudio.playFinish();
    if (newBest) {
      setTimeout(() => galaxyAudio.playNewBest(), 500);
    }
    
    gs.player.isFinished = true;
    setScreen('complete');
  }, [calculateStars]);
  
  // Check collisions
  const checkCollision = useCallback((
    px: number, py: number, pw: number, ph: number,
    block: Block
  ): boolean => {
    return px < block.x + block.width &&
           px + pw > block.x &&
           py < block.y + block.height &&
           py + ph > block.y;
  }, []);
  
  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!gsRef.current || screen !== 'playing') return;
    
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    
    const gs = gsRef.current;
    const keys = keysRef.current;
    const level = getLevelById(gs.level);
    if (!level) return;
    
    const renderer = rendererRef.current;
    if (!renderer) return;
    
    renderer.updateShake();
    
    // Countdown
    if (gs.countdown > 0) {
      gs.countdown -= dt;
      if (gs.countdown <= 0) {
        galaxyAudio.playGo();
      } else if (Math.floor(gs.countdown + dt) !== Math.floor(gs.countdown)) {
        galaxyAudio.playCountdown();
      }
      
      // Render countdown
      renderer.clear(level.background);
      renderer.renderBlocks(level.blocks, gs.cameraX, gs.cameraY);
      renderer.renderPlayer(gs.player, gs.cameraX, gs.cameraY, gs.gravityFlipped);
      renderer.renderCountdown(gs.countdown);
      renderer.end();
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    if (!gs.player.isDead && !gs.player.isFinished) {
      gs.time += dt;
      
      const player = gs.player;
      const gravity = gs.gravityFlipped ? -GRAVITY : GRAVITY;
      
      // Input handling
      if (keys.has('ArrowLeft') || keys.has('KeyA')) {
        player.vx = -MOVE_SPEED;
      } else if (keys.has('ArrowRight') || keys.has('KeyD')) {
        player.vx = MOVE_SPEED;
      } else {
        player.vx *= FRICTION;
      }
      
      // Heavy mode (faster falling)
      player.isHeavy = keys.has('ArrowDown') || keys.has('KeyS');
      
      // Apply gravity
      const gravityMultiplier = player.isHeavy ? 2 : 1;
      player.vy += gravity * gravityMultiplier;
      player.vy = Math.max(-MAX_FALL_SPEED, Math.min(MAX_FALL_SPEED, player.vy));
      
      // Move and check collisions
      const newX = player.x + player.vx;
      const newY = player.y + player.vy;
      
      let onGround = false;
      let hitCeiling = false;
      
      level.blocks.forEach(block => {
        // X collision
        if (checkCollision(newX, player.y, PLAYER_SIZE, PLAYER_SIZE, block)) {
          if (block.type === 'spike') {
            player.isDead = true;
            respawnPlayer();
            return;
          }
          if (block.type !== 'blackhole') {
            player.vx = 0;
          }
        }
        
        // Y collision
        if (checkCollision(player.x, newY, PLAYER_SIZE, PLAYER_SIZE, block)) {
          switch (block.type) {
            case 'normal':
            case 'boost':
            case 'checkpoint':
            case 'ramp':
              if (player.vy > 0 && !gs.gravityFlipped) {
                player.y = block.y - PLAYER_SIZE;
                player.vy = 0;
                onGround = true;
                if (player.isJumping) {
                  player.isJumping = false;
                  galaxyAudio.playLand();
                }
              } else if (player.vy < 0 && gs.gravityFlipped) {
                player.y = block.y + block.height;
                player.vy = 0;
                onGround = true;
                if (player.isJumping) {
                  player.isJumping = false;
                  galaxyAudio.playLand();
                }
              } else if (player.vy < 0 && !gs.gravityFlipped) {
                player.y = block.y + block.height;
                player.vy = 0;
                hitCeiling = true;
              } else if (player.vy > 0 && gs.gravityFlipped) {
                player.y = block.y - PLAYER_SIZE;
                player.vy = 0;
                hitCeiling = true;
              }
              
              if (block.type === 'boost' && onGround) {
                player.vx = player.vx > 0 ? MOVE_SPEED * 2 : -MOVE_SPEED * 2;
                galaxyAudio.playBoost();
              }
              
              if (block.type === 'checkpoint') {
                if (gs.checkpointX !== block.x || gs.checkpointY !== block.y - PLAYER_SIZE) {
                  gs.checkpointX = block.x;
                  gs.checkpointY = block.y - PLAYER_SIZE;
                  galaxyAudio.playCheckpoint();
                }
              }
              
              if (block.type === 'ramp' && onGround) {
                player.vy = JUMP_FORCE * 0.8;
                player.isJumping = true;
                galaxyAudio.playJump();
              }
              break;
              
            case 'rubber':
              if (Math.abs(player.vy) > 2) {
                player.vy *= -0.9;
                galaxyAudio.playBounce();
              } else {
                player.vy = 0;
                onGround = true;
              }
              break;
              
            case 'spike':
              player.isDead = true;
              respawnPlayer();
              return;
              
            case 'gravity_flip':
              gs.gravityFlipped = !gs.gravityFlipped;
              player.vy = gs.gravityFlipped ? -5 : 5;
              galaxyAudio.playGravityFlip();
              break;
              
            case 'finish':
              completeLevel();
              return;
          }
        }
        
        // Black hole attraction
        if (block.type === 'blackhole') {
          const dx = (block.x + block.width / 2) - (player.x + PLAYER_SIZE / 2);
          const dy = (block.y + block.height / 2) - (player.y + PLAYER_SIZE / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 150) {
            const force = (150 - dist) / 150 * 0.5;
            player.vx += dx / dist * force;
            player.vy += dy / dist * force;
            
            if (dist < 30) {
              player.isDead = true;
              galaxyAudio.playBlackhole();
              respawnPlayer();
            }
          }
        }
      });
      
      // Update position
      player.x += player.vx;
      player.y += player.vy;
      
      // Jump
      if ((keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) && onGround) {
        player.vy = gs.gravityFlipped ? -JUMP_FORCE : JUMP_FORCE;
        player.isJumping = true;
        galaxyAudio.playJump();
      }
      
      // Rotation based on velocity
      player.rotation += player.vx * 0.02;
      
      // Death by falling
      if (player.y > CANVAS_HEIGHT + 100 || player.y < -100) {
        player.isDead = true;
        respawnPlayer();
      }
      
      // Add trail
      if (Math.abs(player.vx) > 1) {
        gs.trails.push({
          x: player.x + PLAYER_SIZE / 2,
          y: player.y + PLAYER_SIZE / 2,
          age: 0,
        });
      }
      
      // Update trails
      gs.trails = gs.trails.filter(t => {
        t.age++;
        return t.age < 20;
      });
      
      // Update particles
      gs.particles = gs.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life--;
        return p.life > 0;
      });
      
      // Camera follow
      const targetCamX = player.x - CANVAS_WIDTH / 3;
      const targetCamY = player.y - CANVAS_HEIGHT / 2;
      gs.cameraX += (targetCamX - gs.cameraX) * 0.1;
      gs.cameraY += (targetCamY - gs.cameraY) * 0.05;
      gs.cameraX = Math.max(0, gs.cameraX);
    }
    
    // Render
    renderer.clear(level.background);
    renderer.renderTrails(gs.trails, gs.cameraX, gs.cameraY);
    renderer.renderBlocks(level.blocks, gs.cameraX, gs.cameraY);
    renderer.renderPlayer(gs.player, gs.cameraX, gs.cameraY, gs.gravityFlipped);
    renderer.renderParticles(gs.particles, gs.cameraX, gs.cameraY);
    renderer.renderHUD(gs.time, gs.level, gs.attempts, gs.gravityFlipped);
    renderer.end();
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [screen, checkCollision, respawnPlayer, completeLevel]);
  
  // Start/stop game loop
  useEffect(() => {
    if (screen === 'playing') {
      lastTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [screen, gameLoop]);
  
  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      
      if (e.code === 'Escape') {
        if (screen === 'playing') {
          setScreen('paused');
        } else if (screen === 'paused') {
          setScreen('playing');
        }
      }
      
      if (e.code === 'KeyR' && (screen === 'playing' || screen === 'complete')) {
        initLevel(selectedLevel);
      }
      
      if (e.code === 'Space' && screen === 'complete') {
        if (selectedLevel < getTotalLevels()) {
          initLevel(selectedLevel + 1);
        } else {
          setScreen('levels');
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, selectedLevel, initLevel]);
  
  const handleToggleSound = () => {
    const newState = toggleSound();
    setProgress(loadProgress());
    galaxyAudio.setEnabled(newState);
  };
  
  const handleClearProgress = () => {
    clearProgress();
    setProgress(loadProgress());
  };
  
  // Render menu screen
  const renderMenu = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Animated stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-4 animate-pulse">
          GALAXY RIDER
        </h1>
        <p className="text-cyan-300 text-xl mb-8">Navigate through space obstacles</p>
        
        <div className="flex flex-col gap-4 items-center">
          <Button
            onClick={() => setScreen('levels')}
            className="w-64 h-14 text-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-2 border-cyan-400"
          >
            <Play className="w-6 h-6 mr-2" />
            PLAY
          </Button>
          
          <Button
            onClick={() => setScreen('settings')}
            variant="outline"
            className="w-64 h-12 border-purple-500 text-purple-300 hover:bg-purple-900/50"
          >
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </div>
        
        {/* Stats */}
        <div className="mt-8 flex gap-6 justify-center text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">{progress.highestLevel}</div>
            <div className="text-gray-400">Highest Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{progress.totalFinishes}</div>
            <div className="text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{progress.totalDeaths}</div>
            <div className="text-gray-400">Deaths</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render level select screen
  const renderLevels = () => (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => setScreen('menu')}
            variant="ghost"
            className="text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-3xl font-bold text-cyan-400">SELECT LEVEL</h2>
          <div className="w-20" />
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {LEVELS.map(level => {
            const isUnlocked = progress.unlockedLevels.includes(level.id);
            const bestTime = progress.bestTimes[level.id];
            const stars = bestTime ? calculateStars(bestTime, level.id) : 0;
            
            return (
              <Card
                key={level.id}
                className={`relative p-4 cursor-pointer transition-all ${
                  isUnlocked
                    ? 'bg-slate-800/80 border-cyan-500/50 hover:border-cyan-400 hover:scale-105'
                    : 'bg-slate-900/80 border-gray-700 opacity-60'
                }`}
                onClick={() => isUnlocked && initLevel(level.id)}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                )}
                
                <div className={isUnlocked ? '' : 'opacity-30'}>
                  <div className="text-2xl font-bold text-center text-cyan-400 mb-1">
                    {level.id}
                  </div>
                  <div className="text-xs text-center text-gray-400 mb-2 truncate">
                    {level.name}
                  </div>
                  
                  {/* Stars */}
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[1, 2, 3].map(s => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </div>
                  
                  {/* Best time */}
                  {bestTime && (
                    <div className="text-xs text-center text-green-400">
                      {Math.floor(bestTime / 60)}:{(bestTime % 60).toFixed(1).padStart(4, '0')}
                    </div>
                  )}
                  
                  {/* Difficulty badge */}
                  <div className="flex justify-center mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        level.difficulty === 'easy' ? 'border-green-500 text-green-400' :
                        level.difficulty === 'medium' ? 'border-yellow-500 text-yellow-400' :
                        level.difficulty === 'hard' ? 'border-orange-500 text-orange-400' :
                        'border-red-500 text-red-400'
                      }`}
                    >
                      {level.difficulty}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
  
  // Render settings screen
  const renderSettings = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-96 p-6 bg-slate-800/90 border-purple-500">
        <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">SETTINGS</h2>
        
        <div className="space-y-4">
          <Button
            onClick={handleToggleSound}
            variant="outline"
            className="w-full justify-between border-gray-600"
          >
            <span>Sound Effects</span>
            {progress.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-green-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-red-400" />
            )}
          </Button>
          
          <Button
            onClick={handleClearProgress}
            variant="outline"
            className="w-full justify-between border-red-600 text-red-400 hover:bg-red-900/30"
          >
            <span>Reset Progress</span>
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
        
        <Button
          onClick={() => setScreen('menu')}
          className="w-full mt-6 bg-purple-600 hover:bg-purple-500"
        >
          Back to Menu
        </Button>
      </Card>
    </div>
  );
  
  // Render paused overlay
  const renderPaused = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
      <Card className="w-80 p-6 bg-slate-800/95 border-cyan-500">
        <h2 className="text-3xl font-bold text-center text-cyan-400 mb-6">PAUSED</h2>
        
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setScreen('playing')}
            className="w-full bg-cyan-600 hover:bg-cyan-500"
          >
            <Play className="w-5 h-5 mr-2" />
            Resume
          </Button>
          
          <Button
            onClick={() => initLevel(selectedLevel)}
            variant="outline"
            className="w-full border-yellow-500 text-yellow-400"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Restart
          </Button>
          
          <Button
            onClick={() => setScreen('levels')}
            variant="outline"
            className="w-full border-gray-500"
          >
            Level Select
          </Button>
          
          <Button
            onClick={() => setScreen('menu')}
            variant="ghost"
            className="w-full text-gray-400"
          >
            Main Menu
          </Button>
        </div>
      </Card>
    </div>
  );
  
  // Render complete screen
  const renderComplete = () => {
    const level = getLevelById(selectedLevel);
    const bestTime = progress.bestTimes[selectedLevel];
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/85 z-20">
        <Card className="w-96 p-8 bg-slate-800/95 border-green-500">
          <h2 className="text-3xl font-bold text-center text-green-400 mb-2">
            LEVEL COMPLETE!
          </h2>
          <p className="text-center text-gray-400 mb-6">{level?.name}</p>
          
          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map(s => (
              <Star
                key={s}
                className={`w-10 h-10 transition-all ${
                  s <= earnedStars 
                    ? 'text-yellow-400 fill-yellow-400 animate-bounce' 
                    : 'text-gray-600'
                }`}
                style={{ animationDelay: `${s * 0.1}s` }}
              />
            ))}
          </div>
          
          {/* Time */}
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-white">
              {Math.floor(completedTime / 60)}:{(completedTime % 60).toFixed(2).padStart(5, '0')}
            </div>
            {isNewBest && (
              <Badge className="mt-2 bg-purple-600 animate-pulse">
                ★ NEW BEST TIME! ★
              </Badge>
            )}
            {bestTime && !isNewBest && (
              <div className="text-sm text-gray-400 mt-2">
                Best: {Math.floor(bestTime / 60)}:{(bestTime % 60).toFixed(2).padStart(5, '0')}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3 mt-6">
            {selectedLevel < getTotalLevels() && (
              <Button
                onClick={() => initLevel(selectedLevel + 1)}
                className="w-full bg-green-600 hover:bg-green-500"
              >
                Next Level
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            
            <Button
              onClick={() => initLevel(selectedLevel)}
              variant="outline"
              className="w-full border-yellow-500 text-yellow-400"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Retry
            </Button>
            
            <Button
              onClick={() => setScreen('levels')}
              variant="ghost"
              className="w-full text-gray-400"
            >
              Level Select
            </Button>
          </div>
        </Card>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-purple-500/30 p-3 flex items-center justify-between">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
        
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          GALAXY RIDER
        </h1>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleToggleSound}
            variant="ghost"
            size="sm"
          >
            {progress.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-500" />
            )}
          </Button>
          
          <div className="flex items-center gap-1 text-yellow-400">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-bold">{progress.highestLevel}/{getTotalLevels()}</span>
          </div>
        </div>
      </div>
      
      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg border-2 border-purple-500/50 shadow-lg shadow-purple-500/20"
          />
          
          {screen === 'menu' && renderMenu()}
          {screen === 'levels' && renderLevels()}
          {screen === 'settings' && renderSettings()}
          {screen === 'paused' && renderPaused()}
          {screen === 'complete' && renderComplete()}
        </div>
      </div>
      
      {/* Controls hint */}
      {screen === 'playing' && (
        <div className="text-center py-2 text-gray-500 text-sm">
          Arrow Keys / WASD to move • Space to jump • Down for heavy fall • ESC to pause
        </div>
      )}
    </div>
  );
}
