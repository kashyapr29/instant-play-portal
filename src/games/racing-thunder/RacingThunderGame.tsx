// Racing Thunder - Main Game Component

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Car, Trophy, Settings, Volume2, VolumeX, Music, ChevronRight, Star, Zap, Shield, Clock, Lock, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GameState, GameProgress, RaceState, PlayerState, Particle, PowerUp, Opponent, INITIAL_PROGRESS, LANE_WIDTH, TRACK_WIDTH, XP_PER_LEVEL } from './types';
import { loadProgress, saveProgress, clearProgress, unlockVehicle, unlockTrack, selectVehicle, upgradeVehicleStat, recordRaceResult, toggleSound, toggleMusic } from './storage';
import { VEHICLES, getVehicleById, getUpgradeCost, getVehicleWithUpgrades } from './vehicles';
import { TRACKS, CHALLENGES, getTrackById } from './tracks';
import { renderGame, renderResults } from './renderer';
import { racingAudio } from './audio';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

type Screen = 'menu' | 'garage' | 'tracks' | 'racing' | 'paused' | 'results' | 'challenges' | 'settings';

export default function RacingThunderGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('city-streets');
  const [garageTab, setGarageTab] = useState<'vehicles' | 'upgrades'>('vehicles');
  
  // Game state refs for performance
  const gsRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const raceResultRef = useRef<{ coins: number; xp: number } | null>(null);
  
  // Audio setup
  useEffect(() => {
    racingAudio.setEnabled(progress.soundEnabled);
    racingAudio.setMusicEnabled(progress.musicEnabled);
  }, [progress.soundEnabled, progress.musicEnabled]);
  
  // Initialize game state
  const initRace = useCallback(() => {
    const track = getTrackById(selectedTrackId);
    const vehicleBase = getVehicleById(progress.selectedVehicle);
    if (!track || !vehicleBase) return;
    
    const vehicle = getVehicleWithUpgrades(vehicleBase, progress.vehicleUpgrades);
    
    // Create opponents
    const opponents: Opponent[] = [];
    const oppCount = 3 + track.difficulty;
    for (let i = 0; i < oppCount; i++) {
      const oppVehicle = VEHICLES[Math.floor(Math.random() * 4)];
      opponents.push({
        id: `opp-${i}`,
        name: `Racer ${i + 1}`,
        vehicle: oppVehicle,
        x: (Math.random() - 0.5) * TRACK_WIDTH * 0.6,
        z: 50 + i * 30,
        speed: 0,
        lane: Math.floor(Math.random() * 3) - 1,
        difficulty: track.difficulty,
      });
    }
    
    // Create power-ups
    const powerUps: PowerUp[] = [];
    track.powerUpSpawns.forEach((spawn, i) => {
      const types: PowerUp['type'][] = ['nitro', 'shield', 'magnet', 'slowmo', 'repair'];
      powerUps.push({
        id: `pu-${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        x: spawn.x,
        z: spawn.z,
        collected: false,
      });
    });
    
    gsRef.current = {
      screen: 'racing',
      track,
      vehicle,
      player: {
        x: 0,
        z: 0,
        speed: 0,
        targetSpeed: 0,
        lane: 0,
        rotation: 0,
        driftAngle: 0,
        isDrifting: false,
      },
      opponents,
      powerUps,
      particles: [],
      race: {
        position: oppCount + 1,
        lap: 1,
        totalLaps: track.laps,
        distance: 0,
        speed: 0,
        maxSpeed: 0,
        nitroAmount: 1,
        nitroActive: false,
        shieldActive: false,
        health: 100,
        coins: 0,
        time: 0,
        finished: false,
        crashed: false,
      },
      countdown: 3,
      raceStarted: false,
    };
    
    raceResultRef.current = null;
    setScreen('racing');
    racingAudio.startEngine();
  }, [selectedTrackId, progress.selectedVehicle, progress.vehicleUpgrades]);
  
  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!gsRef.current || screen !== 'racing') return;
    
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;
    
    const gs = gsRef.current;
    const keys = keysRef.current;
    
    // Countdown
    if (gs.countdown > 0) {
      gs.countdown -= dt;
      if (gs.countdown <= 0) {
        gs.raceStarted = true;
        racingAudio.play('race_start');
      } else if (Math.floor(gs.countdown + dt) !== Math.floor(gs.countdown)) {
        racingAudio.play('countdown');
      }
    }
    
    if (gs.raceStarted && !gs.race.finished) {
      gs.race.time += dt;
      
      const vehicle = gs.vehicle!;
      const track = gs.track!;
      const player = gs.player;
      const race = gs.race;
      
      // Input handling
      const accelInput = (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) ? 1 : 0;
      const brakeInput = (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) ? 1 : 0;
      const leftInput = (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) ? 1 : 0;
      const rightInput = (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) ? 1 : 0;
      const nitroInput = keys.has(' ') || keys.has('Shift');
      
      // Calculate max speed based on vehicle stats
      const baseMaxSpeed = 100 + vehicle.baseStats.speed * 20;
      const nitroBonus = race.nitroActive ? vehicle.baseStats.nitro * 5 : 0;
      const targetMaxSpeed = baseMaxSpeed + nitroBonus;
      
      // Acceleration
      if (accelInput) {
        player.targetSpeed = targetMaxSpeed;
      } else if (brakeInput) {
        player.targetSpeed = 0;
        if (player.speed > 10) {
          racingAudio.play('brake');
        }
      } else {
        player.targetSpeed = player.speed * 0.99;
      }
      
      // Apply acceleration based on vehicle stats
      const accelRate = 50 + vehicle.baseStats.acceleration * 15;
      const diff = player.targetSpeed - player.speed;
      player.speed += Math.sign(diff) * Math.min(Math.abs(diff), accelRate * dt);
      player.speed = Math.max(0, player.speed);
      
      race.speed = player.speed;
      race.maxSpeed = Math.max(race.maxSpeed, player.speed);
      
      // Steering
      const steerSpeed = 3 + vehicle.baseStats.handling * 0.5;
      const steerInput = rightInput - leftInput;
      player.x += steerInput * steerSpeed * dt * (player.speed / 100);
      player.x = Math.max(-TRACK_WIDTH / 2 + 1, Math.min(TRACK_WIDTH / 2 - 1, player.x));
      
      // Drift
      if (Math.abs(steerInput) > 0 && player.speed > 80) {
        player.isDrifting = true;
        player.driftAngle += steerInput * dt * 30;
        player.driftAngle = Math.max(-30, Math.min(30, player.driftAngle));
      } else {
        player.isDrifting = false;
        player.driftAngle *= 0.9;
      }
      
      if (player.isDrifting && Math.random() < 0.3) {
        gs.particles.push(createParticle(player.x, 0, player.z - 2, 'dust'));
      }
      
      // Nitro
      if (nitroInput && race.nitroAmount > 0 && !race.nitroActive) {
        race.nitroActive = true;
        racingAudio.play('nitro');
      }
      
      if (race.nitroActive) {
        race.nitroAmount -= dt * 0.3;
        if (race.nitroAmount <= 0) {
          race.nitroAmount = 0;
          race.nitroActive = false;
          racingAudio.play('nitro_end');
        }
        // Nitro particles
        if (Math.random() < 0.5) {
          gs.particles.push(createParticle(player.x, 0, player.z - 3, 'nitro'));
        }
      } else if (!nitroInput) {
        race.nitroAmount = Math.min(1, race.nitroAmount + dt * 0.1);
      }
      
      // Move player
      player.z += player.speed * dt * 0.5;
      race.distance = player.z;
      
      // Lap completion
      if (player.z >= track.length * race.lap) {
        if (race.lap >= race.totalLaps) {
          // Race finished
          race.finished = true;
          racingAudio.stopEngine();
          racingAudio.play('race_finish');
          
          // Calculate rewards
          const positionBonus = [500, 300, 200, 100, 50][race.position - 1] || 25;
          const coinsEarned = race.coins + positionBonus;
          const xpEarned = 100 + (gs.opponents.length + 1 - race.position) * 50;
          
          raceResultRef.current = { coins: coinsEarned, xp: xpEarned };
          
          const newProgress = recordRaceResult(
            track.id,
            race.time,
            race.position,
            race.distance,
            coinsEarned,
            xpEarned
          );
          setProgress(newProgress);
          
          if (race.position === 1) {
            racingAudio.play('win');
          }
        } else {
          race.lap++;
          racingAudio.play('lap_complete');
        }
      }
      
      // Update engine sound
      racingAudio.updateEngine(player.speed / targetMaxSpeed);
      
      // Update opponents
      updateOpponents(gs, dt);
      
      // Check collisions with obstacles
      track.obstacles.forEach(obs => {
        const obsZ = obs.z + Math.floor(player.z / track.length) * track.length;
        const dz = Math.abs(player.z - obsZ);
        const dx = Math.abs(player.x - obs.x);
        
        if (dz < 5 && dx < obs.width + 1) {
          if (!race.shieldActive) {
            race.health -= 10 * vehicle.baseStats.durability / 10;
            player.speed *= 0.7;
            racingAudio.play('collision');
            
            for (let i = 0; i < 5; i++) {
              gs.particles.push(createParticle(player.x, 0.5, player.z, 'spark'));
            }
          }
        }
      });
      
      // Check power-up collection
      gs.powerUps.forEach(pu => {
        if (pu.collected) return;
        const puZ = pu.z + Math.floor(player.z / track.length) * track.length;
        const dz = Math.abs(player.z - puZ);
        const dx = Math.abs(player.x - pu.x);
        
        if (dz < 10 && dx < 2) {
          pu.collected = true;
          racingAudio.play('powerup');
          applyPowerUp(gs, pu.type);
        }
      });
      
      // Spawn coins
      if (Math.random() < dt * 2) {
        const coinZ = player.z + 100 + Math.random() * 100;
        if (!gs.powerUps.find(p => Math.abs(p.z - (coinZ % track.length)) < 20)) {
          // Coin collected inline
          race.coins++;
          racingAudio.play('coin');
          gs.particles.push(createParticle((Math.random() - 0.5) * 6, 1, coinZ, 'coin'));
        }
      }
      
      // Update position
      let position = 1;
      gs.opponents.forEach(opp => {
        if (opp.z > player.z) position++;
      });
      
      if (position !== race.position) {
        if (position < race.position) {
          racingAudio.play('position_up');
        } else {
          racingAudio.play('position_down');
        }
        race.position = position;
      }
      
      // Update particles
      gs.particles = gs.particles.filter(p => {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        p.vy -= 5 * dt; // Gravity
        return p.life > 0;
      });
      
      // Shield timer
      if (race.shieldActive) {
        // Shield lasts for a fixed duration, handled in applyPowerUp
      }
      
      // Health check
      if (race.health <= 0) {
        race.crashed = true;
        race.finished = true;
        racingAudio.stopEngine();
        racingAudio.play('crash');
        racingAudio.play('lose');
        
        raceResultRef.current = { coins: 0, xp: 25 };
        const newProgress = recordRaceResult(
          track.id,
          race.time,
          gs.opponents.length + 1,
          race.distance,
          0,
          25
        );
        setProgress(newProgress);
      }
    }
    
    // Render
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && gs) {
      if (gs.race.finished && raceResultRef.current) {
        renderResults(ctx, gs, CANVAS_WIDTH, CANVAS_HEIGHT, raceResultRef.current.coins, raceResultRef.current.xp);
      } else {
        renderGame(ctx, gs, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [screen]);
  
  // Start/stop game loop
  useEffect(() => {
    if (screen === 'racing') {
      lastTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [screen, gameLoop]);
  
  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      
      if (e.key === 'Escape' && screen === 'racing') {
        if (gsRef.current?.race.finished) {
          setScreen('menu');
          gsRef.current = null;
        } else if (gsRef.current?.raceStarted) {
          setScreen('paused');
        }
      }
      
      if ((e.key === ' ' || e.key === 'Enter') && gsRef.current?.race.finished) {
        setScreen('menu');
        gsRef.current = null;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen]);
  
  // Helper functions
  function createParticle(x: number, y: number, z: number, type: Particle['type']): Particle {
    const colors: Record<string, string> = {
      spark: '#fbbf24',
      smoke: '#6b7280',
      nitro: '#06b6d4',
      coin: '#fbbf24',
      dust: '#a1a1aa',
    };
    
    return {
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 2,
      vz: (Math.random() - 0.5) * 3,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
      color: colors[type],
      size: type === 'coin' ? 0.5 : 0.2 + Math.random() * 0.3,
      type,
    };
  }
  
  function applyPowerUp(gs: GameState, type: PowerUp['type']) {
    switch (type) {
      case 'nitro':
        gs.race.nitroAmount = Math.min(1, gs.race.nitroAmount + 0.5);
        break;
      case 'shield':
        gs.race.shieldActive = true;
        setTimeout(() => {
          if (gsRef.current) gsRef.current.race.shieldActive = false;
        }, 5000);
        break;
      case 'repair':
        gs.race.health = Math.min(100, gs.race.health + 30);
        break;
      case 'magnet':
        gs.race.coins += 10;
        break;
      case 'slowmo':
        gs.opponents.forEach(o => o.speed *= 0.7);
        setTimeout(() => {
          if (gsRef.current) gsRef.current.opponents.forEach(o => o.speed /= 0.7);
        }, 3000);
        break;
    }
  }
  
  function updateOpponents(gs: GameState, dt: number) {
    const track = gs.track!;
    const player = gs.player;
    
    gs.opponents.forEach(opp => {
      // AI speed based on difficulty
      const targetSpeed = 80 + opp.difficulty * 15 + Math.sin(opp.z * 0.01) * 10;
      opp.speed += (targetSpeed - opp.speed) * dt * 2;
      
      // Move forward
      opp.z += opp.speed * dt * 0.5;
      
      // Lane changes
      if (Math.random() < dt * 0.5) {
        opp.lane = Math.floor(Math.random() * 3) - 1;
      }
      
      const targetX = opp.lane * LANE_WIDTH;
      opp.x += (targetX - opp.x) * dt * 2;
      
      // Avoid player
      const dzPlayer = opp.z - player.z;
      const dxPlayer = opp.x - player.x;
      if (Math.abs(dzPlayer) < 20 && Math.abs(dxPlayer) < 3) {
        opp.x += Math.sign(dxPlayer || 1) * dt * 10;
      }
      
      // Lap around
      if (opp.z > track.length * gs.race.totalLaps + 100) {
        opp.z = player.z + 200 + Math.random() * 100;
      }
    });
  }
  
  // UI Handlers
  const handleUnlockVehicle = (vehicleId: string, cost: number) => {
    const newProgress = unlockVehicle(vehicleId, cost);
    if (newProgress) {
      setProgress(newProgress);
      racingAudio.play('purchase');
    }
  };
  
  const handleSelectVehicle = (vehicleId: string) => {
    const newProgress = selectVehicle(vehicleId);
    setProgress(newProgress);
    racingAudio.play('menu_select');
  };
  
  const handleUpgradeVehicle = (stat: keyof typeof progress.vehicleUpgrades['any']) => {
    const vehicleId = progress.selectedVehicle;
    const currentLevel = progress.vehicleUpgrades[vehicleId]?.[stat] || 0;
    const cost = getUpgradeCost(currentLevel);
    
    const newProgress = upgradeVehicleStat(vehicleId, stat, cost);
    if (newProgress) {
      setProgress(newProgress);
      racingAudio.play('upgrade');
    }
  };
  
  const handleUnlockTrack = (trackId: string, cost: number) => {
    const newProgress = unlockTrack(trackId, cost);
    if (newProgress) {
      setProgress(newProgress);
      racingAudio.play('purchase');
    }
  };
  
  const handleToggleSound = () => {
    const newProgress = toggleSound();
    setProgress(newProgress);
    racingAudio.setEnabled(newProgress.soundEnabled);
  };
  
  const handleToggleMusic = () => {
    const newProgress = toggleMusic();
    setProgress(newProgress);
    racingAudio.setMusicEnabled(newProgress.musicEnabled);
  };
  
  const handleResetProgress = () => {
    if (confirm('Are you sure you want to reset all progress?')) {
      clearProgress();
      setProgress(INITIAL_PROGRESS);
      racingAudio.play('menu_back');
    }
  };
  
  const selectedVehicle = getVehicleById(progress.selectedVehicle);
  const vehicleWithUpgrades = selectedVehicle ? getVehicleWithUpgrades(selectedVehicle, progress.vehicleUpgrades) : null;
  
  // Render different screens
  if (screen === 'racing' || screen === 'paused') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-xl shadow-2xl border-2 border-amber-500/30"
            onClick={() => {
              if (gsRef.current?.race.finished) {
                setScreen('menu');
                gsRef.current = null;
              }
            }}
          />
          
          {screen === 'paused' && (
            <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center gap-4">
              <h2 className="text-4xl font-bold text-white mb-4">PAUSED</h2>
              <Button 
                size="lg" 
                className="bg-amber-500 hover:bg-amber-600 text-black w-48"
                onClick={() => setScreen('racing')}
              >
                <Play className="w-5 h-5 mr-2" /> Resume
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-48 border-white/30 text-white hover:bg-white/10"
                onClick={() => {
                  setScreen('menu');
                  gsRef.current = null;
                  racingAudio.stopEngine();
                }}
              >
                Quit Race
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-slate-400 text-sm">
          ↑↓ or W/S: Accelerate/Brake • ←→ or A/D: Steer • SPACE/SHIFT: Nitro • ESC: Pause
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="p-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            🏎️ Racing Thunder
          </h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-amber-400">{progress.coins}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-400">Lvl {progress.level}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {screen === 'menu' && (
          <div className="flex flex-col items-center gap-8 py-12">
            <div className="text-center mb-8">
              <h2 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                RACING THUNDER
              </h2>
              <p className="text-slate-400">High-speed arcade racing action</p>
            </div>
            
            {/* Current Vehicle Preview */}
            {vehicleWithUpgrades && (
              <Card className="bg-white/5 border-white/10 p-6 w-full max-w-md">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
                    style={{ backgroundColor: vehicleWithUpgrades.color + '40' }}
                  >
                    {vehicleWithUpgrades.type === 'car' ? '🚗' : '🏍️'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{vehicleWithUpgrades.name}</h3>
                    <p className="text-sm text-slate-400">{vehicleWithUpgrades.type === 'car' ? 'Car' : 'Motorcycle'}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                        <Zap className="w-3 h-3 mr-1" /> {vehicleWithUpgrades.baseStats.speed.toFixed(1)}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                        <Shield className="w-3 h-3 mr-1" /> {vehicleWithUpgrades.baseStats.durability.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Menu Buttons */}
            <div className="grid gap-4 w-full max-w-md">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold h-14 text-lg"
                onClick={() => setScreen('tracks')}
              >
                <Play className="w-6 h-6 mr-2" /> START RACE
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/20 hover:bg-white/10 h-12"
                onClick={() => { setScreen('garage'); racingAudio.play('menu_select'); }}
              >
                <Car className="w-5 h-5 mr-2" /> Garage
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/20 hover:bg-white/10 h-12"
                onClick={() => { setScreen('challenges'); racingAudio.play('menu_select'); }}
              >
                <Trophy className="w-5 h-5 mr-2" /> Challenges
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/20 hover:bg-white/10 h-12"
                onClick={() => { setScreen('settings'); racingAudio.play('menu_select'); }}
              >
                <Settings className="w-5 h-5 mr-2" /> Settings
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-4">
              <Card className="bg-white/5 border-white/10 p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{progress.totalRaces}</div>
                <div className="text-xs text-slate-400">Races</div>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{progress.totalWins}</div>
                <div className="text-xs text-slate-400">Wins</div>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{Math.floor(progress.totalDistance / 1000)}km</div>
                <div className="text-xs text-slate-400">Distance</div>
              </Card>
            </div>
          </div>
        )}
        
        {screen === 'tracks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setScreen('menu')} className="text-white">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
              <h2 className="text-2xl font-bold">Select Track</h2>
              <div className="w-24" />
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRACKS.map(track => {
                const isUnlocked = progress.unlockedTracks.includes(track.id);
                const bestTime = progress.trackBestTimes[track.id];
                
                return (
                  <Card 
                    key={track.id}
                    className={`bg-white/5 border-white/10 p-4 cursor-pointer transition-all ${
                      isUnlocked ? 'hover:bg-white/10 hover:border-amber-500/50' : 'opacity-60'
                    } ${selectedTrackId === track.id ? 'border-amber-500' : ''}`}
                    onClick={() => {
                      if (isUnlocked) {
                        setSelectedTrackId(track.id);
                        racingAudio.play('menu_select');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{track.name}</h3>
                      {!isUnlocked && <Lock className="w-4 h-4 text-slate-500" />}
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{track.description}</p>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < track.difficulty ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-2">{track.laps} Laps</span>
                    </div>
                    
                    {bestTime && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Best: {Math.floor(bestTime / 60)}:{(bestTime % 60).toFixed(2).padStart(5, '0')}
                      </div>
                    )}
                    
                    {!isUnlocked && (
                      <Button 
                        size="sm" 
                        className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnlockTrack(track.id, track.unlockCost);
                        }}
                        disabled={progress.coins < track.unlockCost}
                      >
                        <Coins className="w-4 h-4 mr-1" /> Unlock ({track.unlockCost})
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-center pt-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold px-12"
                onClick={initRace}
                disabled={!progress.unlockedTracks.includes(selectedTrackId)}
              >
                <Play className="w-5 h-5 mr-2" /> START RACE
              </Button>
            </div>
          </div>
        )}
        
        {screen === 'garage' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setScreen('menu')} className="text-white">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
              <h2 className="text-2xl font-bold">Garage</h2>
              <div className="w-24" />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button 
                variant={garageTab === 'vehicles' ? 'default' : 'outline'}
                onClick={() => setGarageTab('vehicles')}
                className={garageTab === 'vehicles' ? 'bg-amber-500 text-black' : 'border-white/20'}
              >
                Vehicles
              </Button>
              <Button 
                variant={garageTab === 'upgrades' ? 'default' : 'outline'}
                onClick={() => setGarageTab('upgrades')}
                className={garageTab === 'upgrades' ? 'bg-amber-500 text-black' : 'border-white/20'}
              >
                Upgrades
              </Button>
            </div>
            
            {garageTab === 'vehicles' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {VEHICLES.map(vehicle => {
                  const isUnlocked = progress.unlockedVehicles.includes(vehicle.id);
                  const isSelected = progress.selectedVehicle === vehicle.id;
                  
                  return (
                    <Card 
                      key={vehicle.id}
                      className={`bg-white/5 border-white/10 p-4 transition-all ${
                        isUnlocked ? 'hover:bg-white/10' : 'opacity-60'
                      } ${isSelected ? 'border-amber-500 ring-1 ring-amber-500' : ''}`}
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <div 
                          className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                          style={{ backgroundColor: vehicle.color + '40' }}
                        >
                          {vehicle.type === 'car' ? '🚗' : '🏍️'}
                        </div>
                        <div>
                          <h3 className="font-bold">{vehicle.name}</h3>
                          <p className="text-xs text-slate-400">{vehicle.type === 'car' ? 'Car' : 'Motorcycle'}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-400 mb-3">{vehicle.description}</p>
                      
                      <div className="space-y-2 mb-3">
                        {(['speed', 'acceleration', 'handling', 'nitro', 'durability'] as const).map(stat => (
                          <div key={stat} className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 w-20 capitalize">{stat}</span>
                            <Progress value={vehicle.baseStats[stat] * 10} className="h-2 flex-1" />
                          </div>
                        ))}
                      </div>
                      
                      {isUnlocked ? (
                        <Button 
                          className={`w-full ${isSelected ? 'bg-green-600' : 'bg-amber-500 hover:bg-amber-600'} text-black`}
                          onClick={() => handleSelectVehicle(vehicle.id)}
                          disabled={isSelected}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </Button>
                      ) : (
                        <Button 
                          className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                          onClick={() => handleUnlockVehicle(vehicle.id, vehicle.unlockCost)}
                          disabled={progress.coins < vehicle.unlockCost}
                        >
                          <Coins className="w-4 h-4 mr-1" /> Unlock ({vehicle.unlockCost})
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
            
            {garageTab === 'upgrades' && vehicleWithUpgrades && (
              <Card className="bg-white/5 border-white/10 p-6 max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div 
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl"
                    style={{ backgroundColor: vehicleWithUpgrades.color + '40' }}
                  >
                    {vehicleWithUpgrades.type === 'car' ? '🚗' : '🏍️'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{vehicleWithUpgrades.name}</h3>
                    <p className="text-sm text-slate-400">Upgrade your vehicle's stats</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(['speed', 'acceleration', 'handling', 'nitro', 'durability'] as const).map(stat => {
                    const currentLevel = progress.vehicleUpgrades[progress.selectedVehicle]?.[stat] || 0;
                    const cost = getUpgradeCost(currentLevel);
                    const maxLevel = 5;
                    
                    return (
                      <div key={stat} className="flex items-center gap-4">
                        <div className="w-24">
                          <div className="text-sm font-medium capitalize">{stat}</div>
                          <div className="text-xs text-slate-400">Lvl {currentLevel}/{maxLevel}</div>
                        </div>
                        <Progress 
                          value={(selectedVehicle!.baseStats[stat] + currentLevel * 0.5) * 10} 
                          className="h-3 flex-1" 
                        />
                        <Button 
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-black"
                          onClick={() => handleUpgradeVehicle(stat)}
                          disabled={currentLevel >= maxLevel || progress.coins < cost}
                        >
                          <Coins className="w-3 h-3 mr-1" /> {cost}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
        
        {screen === 'challenges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setScreen('menu')} className="text-white">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
              <h2 className="text-2xl font-bold">Challenges</h2>
              <div className="w-24" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {CHALLENGES.map(challenge => {
                const isCompleted = progress.completedChallenges.includes(challenge.id);
                
                return (
                  <Card 
                    key={challenge.id}
                    className={`bg-white/5 border-white/10 p-4 ${isCompleted ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">{challenge.name}</h3>
                      {isCompleted && <Badge className="bg-green-600">Completed</Badge>}
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{challenge.description}</p>
                    <div className="flex items-center justify-between">
                      <Progress value={isCompleted ? 100 : 0} className="h-2 flex-1 mr-4" />
                      <div className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-4 h-4" />
                        <span className="font-bold">{challenge.reward}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
        {screen === 'settings' && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setScreen('menu')} className="text-white">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back
              </Button>
              <h2 className="text-2xl font-bold">Settings</h2>
              <div className="w-24" />
            </div>
            
            <Card className="bg-white/5 border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {progress.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span>Sound Effects</span>
                </div>
                <Button 
                  variant={progress.soundEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleSound}
                  className={progress.soundEnabled ? 'bg-amber-500 text-black' : 'border-white/20'}
                >
                  {progress.soundEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5" />
                  <span>Music</span>
                </div>
                <Button 
                  variant={progress.musicEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleMusic}
                  className={progress.musicEnabled ? 'bg-amber-500 text-black' : 'border-white/20'}
                >
                  {progress.musicEnabled ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <hr className="border-white/10" />
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleResetProgress}
              >
                Reset All Progress
              </Button>
            </Card>
            
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="font-bold mb-3">Controls</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Accelerate</span>
                  <span className="text-white">↑ or W</span>
                </div>
                <div className="flex justify-between">
                  <span>Brake</span>
                  <span className="text-white">↓ or S</span>
                </div>
                <div className="flex justify-between">
                  <span>Steer Left</span>
                  <span className="text-white">← or A</span>
                </div>
                <div className="flex justify-between">
                  <span>Steer Right</span>
                  <span className="text-white">→ or D</span>
                </div>
                <div className="flex justify-between">
                  <span>Nitro Boost</span>
                  <span className="text-white">SPACE or SHIFT</span>
                </div>
                <div className="flex justify-between">
                  <span>Pause</span>
                  <span className="text-white">ESC</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
