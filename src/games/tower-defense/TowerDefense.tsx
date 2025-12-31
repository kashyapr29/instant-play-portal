import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Heart, Coins, Play, RotateCcw } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { Tower, Enemy, Projectile } from './types';
import { useHighScore } from '@/hooks/useHighScore';
import { useGameAudio } from '@/hooks/useGameAudio';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const START_GOLD = 200;
const START_HEALTH = 20;
const TOWER_COST = 100;

interface GameStateExt {
  score: number;
  level: number;
  gameOver: boolean;
  isPaused: boolean;
  gold: number;
  health: number;
  waveCount: number;
}

interface PathPoint {
  x: number;
  y: number;
}

const PATH: PathPoint[] = [
  { x: 50, y: 200 },
  { x: 300, y: 200 },
  { x: 300, y: 400 },
  { x: 700, y: 400 },
  { x: 700, y: 150 },
  { x: 950, y: 150 },
];

const TowerDefense = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playSound } = useGameAudio();
  const [gameState, setGameState] = useState<GameStateExt>({
    score: 0,
    level: 1,
    gameOver: false,
    isPaused: false,
    gold: START_GOLD,
    health: START_HEALTH,
    waveCount: 1,
  });

  const { highScore, updateHighScore } = useHighScore('tower-defense');
  const towersRef = useRef<Tower[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  // Build spots and occupancy
  const buildSpots = useRef(
    [
      { x: 180, y: 120 },
      { x: 420, y: 260 },
      { x: 520, y: 320 },
      { x: 760, y: 200 },
      { x: 240, y: 480 },
    ] as { x: number; y: number }[]
  ).current;
  const occupiedSpotsRef = useRef<Record<string, boolean>>({});
  const animationRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);
  const towerPreviewRef = useRef<{ x: number; y: number } | null>(null);
  const previewSpotRef = useRef<number | null>(null);

  // Wave & spawn management
  const waveEnemiesLeftRef = useRef<number>(5 + 1 * 2); // initial enemies for wave
  const [spawningPaused, setSpawningPaused] = useState(false);

  // Track tower levels separately to avoid changing the imported Tower interface
  const towerLevelsRef = useRef<Record<string, number>>({});
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectedTowerScreenPos, setSelectedTowerScreenPos] = useState<{ left: number; top: number } | null>(null);

  // Drawing helper functions
  const drawCactus = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x - 8, y, 16, 50);
    ctx.fillRect(x - 30, y + 15, 25, 10);
    ctx.fillRect(x + 5, y + 30, 25, 10);
  }, []);

  const drawTowerShape = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillRect(x - 20, y - 20, 40, 40);
    ctx.fillStyle = '#4a3a32';
    ctx.fillRect(x - 15, y - 15, 30, 30);
    ctx.fillStyle = '#6b5b52';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4a3a32';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x - 12, y - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 8);
    ctx.lineTo(x + 12, y - 12);
    ctx.stroke();
  }, []);

  const drawTerrain = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(139, 90, 43, ${Math.random() * 0.1})`;
      ctx.fillRect(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT,
        Math.random() * 40 + 10,
        Math.random() * 40 + 10
      );
    }

    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.ellipse(100, 500, 25, 20, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#9d8b7a';
    ctx.beginPath();
    ctx.ellipse(900, 550, 30, 25, -0.2, 0, Math.PI * 2);
    ctx.fill();

    drawCactus(ctx, 80, 100);
    drawCactus(ctx, 920, 480);
  }, [drawCactus]);

  const drawPathAndTowers = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Draw path
      ctx.strokeStyle = '#a0826d';
      ctx.lineWidth = 80;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(PATH[0].x, PATH[0].y);
      for (let i = 1; i < PATH.length; i++) {
        ctx.lineTo(PATH[i].x, PATH[i].y);
      }
      ctx.stroke();

      // Path texture
      for (let i = 1; i < PATH.length; i++) {
        const p1 = PATH[i - 1];
        const p2 = PATH[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.ceil(dist / 20);

        for (let j = 0; j < steps; j++) {
          const t = j / steps;
          const x = p1.x + dx * t;
          const y = p1.y + dy * t;
          ctx.fillStyle = `rgba(128, 100, 80, ${Math.random() * 0.3})`;
          ctx.fillRect(x - 10, y - 10, 20, 20);
        }
      }

      // Draw build spots
      buildSpots.forEach((spot, idx) => {
        const key = `${spot.x}_${spot.y}`;
        const occupied = !!occupiedSpotsRef.current[key];
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = occupied ? 'rgba(60,60,60,0.9)' : 'rgba(255,255,255,0.06)';
        ctx.fill();
        ctx.strokeStyle = previewSpotRef.current === idx ? (occupied ? 'rgba(255,0,0,0.9)' : 'rgba(0,255,128,0.9)') : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = previewSpotRef.current === idx ? 3 : 1;
        ctx.stroke();
      });

      // Draw towers
      towersRef.current.forEach((tower) => {
        ctx.fillStyle = '#5a4a42';
        drawTowerShape(ctx, tower.x, tower.y);
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw preview snapped to spot if available
      if (towerPreviewRef.current && previewSpotRef.current !== null) {
        const spot = buildSpots[previewSpotRef.current];
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = gameState.gold >= TOWER_COST ? '#3b82f6' : '#ef4444';
        drawTowerShape(ctx, spot.x, spot.y);
        ctx.globalAlpha = 1;
      }
    },
    [gameState.gold, drawTowerShape, buildSpots]
  );

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    if (enemy.type === 'boss') {
      ctx.fillStyle = '#7b68ee';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 18, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(enemy.x - 6, enemy.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 6, enemy.y - 5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(enemy.x - 6, enemy.y - 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 6, enemy.y - 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'void') {
      // Void enemy - dark shadowy appearance
      ctx.fillStyle = '#2d2d44';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 17, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5d4e9f';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 14, 17, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9d8eff';
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 5, enemy.y - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Aura effect
      ctx.strokeStyle = 'rgba(157, 142, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 20, 23, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (enemy.type === 'fast') {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 12, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(enemy.x - 4, enemy.y - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 4, enemy.y - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (enemy.type === 'elite') {
      // Elite enemy - tougher mid-boss
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 16, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 5, enemy.y - 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(enemy.x, enemy.y, 15, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 5, enemy.y - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 4, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(enemy.x + 5, enemy.y - 4, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    const healthBarWidth = 35;
    const healthBarHeight = 4;
    ctx.fillStyle = '#000';
    ctx.fillRect(enemy.x - healthBarWidth / 2, enemy.y - 30, healthBarWidth, healthBarHeight);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(
      enemy.x - healthBarWidth / 2,
      enemy.y - 30,
      (healthBarWidth * enemy.health) / enemy.maxHealth,
      healthBarHeight
    );
  }, []);

  const spawnEnemy = useCallback(() => {
    // Only spawn if current wave still has enemies to spawn
    if (waveEnemiesLeftRef.current <= 0) return;

    const rand = Math.random();
    // Introduce progressively stronger enemies as waves advance
    let type: 'normal' | 'fast' | 'boss' | 'elite' | 'void' = 'normal';
    let speed = 1.5;
    let health = 30;

    // Bosses on milestone waves
    if (gameState.waveCount % 6 === 0 && rand < 0.3) {
      type = 'boss';
      speed = 0.8;
      health = 150;
    } else if (gameState.waveCount >= 5 && rand < 0.15) {
      // New Void enemy - powerful mid-boss type appearing from wave 5+
      type = 'void';
      speed = 1.3;
      health = 95;
    } else if (gameState.waveCount >= 3 && rand < 0.18) {
      type = 'elite';
      speed = 1.2;
      health = 60;
    } else if (rand < 0.25) {
      type = 'fast';
      speed = 2.5;
      health = 18;
    }

    const finalHealth = Math.ceil(health * (1 + (gameState.level - 1) * 0.5));

    enemiesRef.current.push({
      id: Math.random().toString(),
      x: PATH[0].x,
      y: PATH[0].y,
      pathIndex: 0,
      health: finalHealth,
      maxHealth: finalHealth,
      speed: speed,
      type,
    });
    
    // Decrement wave enemy counter
    waveEnemiesLeftRef.current--;
  }, [gameState.level, gameState.waveCount]);

  const update = useCallback((time: number) => {
    if (gameState.gameOver || gameState.isPaused) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    drawTerrain(ctx);
    drawPathAndTowers(ctx);

    const spawnRate = 2000 - gameState.level * 100;
    if (time - lastSpawnTime.current > Math.max(spawnRate, 800)) {
      spawnEnemy();
      lastSpawnTime.current = time;
    }

    enemiesRef.current = enemiesRef.current.filter((e) => {
      if (e.health <= 0) {
        // reward differs for enemy types
        const reward = e.type === 'boss' ? 80 : e.type === 'void' ? 60 : e.type === 'elite' ? 45 : e.type === 'fast' ? 20 : 30;
        setGameState((prev) => ({
          ...prev,
          score: prev.score + reward,
          gold: prev.gold + reward,
        }));
        playSound('success');
        return false;
      }
      return true;
    });

    enemiesRef.current.forEach((e) => {
      if (e.pathIndex < PATH.length - 1) {
        const target = PATH[e.pathIndex + 1];
        const dx = target.x - e.x;
        const dy = target.y - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist < e.speed) {
          e.pathIndex++;
        } else {
          e.x += (dx / dist) * e.speed;
          e.y += (dy / dist) * e.speed;
        }
      } else {
        enemiesRef.current = enemiesRef.current.filter((em) => em.id !== e.id);
        setGameState((prev) => {
          const newHealth = prev.health - 1;
          if (newHealth <= 0) {
            playSound('break');
            return { ...prev, health: 0, gameOver: true };
          }
          playSound('break');
          return { ...prev, health: newHealth };
        });
      }

      drawEnemy(ctx, e);
    });

    // If wave finished (no more to spawn and none alive), advance wave
    if (waveEnemiesLeftRef.current <= 0 && enemiesRef.current.length === 0) {
      const nextLevel = gameState.level + 1;
      const nextWave = gameState.waveCount + 1;
      // Increase enemies per wave as difficulty
      waveEnemiesLeftRef.current = 5 + nextLevel * 2;
      setGameState((prev) => ({ ...prev, level: nextLevel, waveCount: nextWave }));
      playSound('success');
    }

    // draw enemies done
    // Tower behavior
    towersRef.current.forEach((tower) => {
      if (time - tower.lastFired > tower.fireRate) {
        const target = enemiesRef.current.find((e) => {
          const dist = Math.hypot(e.x - tower.x, e.y - tower.y);
          return dist < tower.range;
        });

        if (target) {
          projectilesRef.current.push({
            x: tower.x,
            y: tower.y,
            targetId: target.id,
            damage: tower.damage,
            speed: 6,
          });
          tower.lastFired = time;
        }
      }
    });

    projectilesRef.current = projectilesRef.current.filter((p) => {
      const target = enemiesRef.current.find((e) => e.id === p.targetId);
      if (!target) return false;

      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < p.speed) {
        target.health -= p.damage;
        playSound('break');
        return false;
      }

      p.x += (dx / dist) * p.speed;
      p.y += (dy / dist) * p.speed;

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      return true;
    });
  }, [gameState, spawnEnemy, playSound, drawTerrain, drawPathAndTowers, drawEnemy]);

  useEffect(() => {
    let frameId: number;
    const animationLoop = (time: number) => {
      update(time);
      frameId = requestAnimationFrame(animationLoop);
    };
    frameId = requestAnimationFrame(animationLoop);
    return () => cancelAnimationFrame(frameId);
  }, [update]);

  const placeTower = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicking an existing tower -> select it
      const clickedTower = towersRef.current.find((t) => Math.hypot(t.x - x, t.y - y) < 22);
      if (clickedTower) {
        setSelectedTowerId(clickedTower.id);
        setSelectedTowerScreenPos({ left: rect.left + clickedTower.x, top: rect.top + clickedTower.y });
        return;
      }

      if (gameState.gold < TOWER_COST) return;

      let onPath = false;
      for (let i = 0; i < PATH.length - 1; i++) {
        const p1 = PATH[i];
        const p2 = PATH[i + 1];
        const dist = Math.abs(
          (p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x
        ) / Math.hypot(p2.y - p1.y, p2.x - p1.x);

        if (dist < 50) {
          onPath = true;
          break;
        }
      }

      if (onPath) return;

      // Only allow placement on predefined build spots
      const spotIdx = previewSpotRef.current;
      if (spotIdx === null) return;
      const spot = buildSpots[spotIdx];
      const spotKey = `${spot.x}_${spot.y}`;
      if (occupiedSpotsRef.current[spotKey]) return;

      playSound('click');
      const id = Math.random().toString();
      towersRef.current.push({
        id,
        x: spot.x,
        y: spot.y,
        type: 'basic',
        range: 150,
        damage: 15,
        fireRate: 600,
        lastFired: 0,
      });
      towerLevelsRef.current[id] = 1;
      occupiedSpotsRef.current[spotKey] = true;
      setGameState((prev) => ({ ...prev, gold: prev.gold - TOWER_COST }));
    },
    [gameState.gold, playSound, buildSpots]
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find nearest build spot within threshold
    let nearest: number | null = null;
    let nearestDist = Infinity;
    const THRESH = 40;
    buildSpots.forEach((spot, idx) => {
      const d = Math.hypot(spot.x - x, spot.y - y);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = idx;
      }
    });

    if (nearest !== null && nearestDist <= THRESH) {
      previewSpotRef.current = nearest;
      towerPreviewRef.current = { x: buildSpots[nearest].x, y: buildSpots[nearest].y };
    } else {
      previewSpotRef.current = null;
      towerPreviewRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    towerPreviewRef.current = null;
    previewSpotRef.current = null;
  };

  const upgradeTower = (id: string) => {
    const level = towerLevelsRef.current[id] || 1;
    const cost = 80 * (level + 1);
    if (gameState.gold < cost) return;
    const tower = towersRef.current.find((t) => t.id === id);
    if (!tower) return;
    towerLevelsRef.current[id] = level + 1;
    tower.damage += 10;
    tower.range += 20;
    tower.fireRate = Math.max(180, tower.fireRate - 60);
    setGameState((prev) => ({ ...prev, gold: prev.gold - cost }));
    playSound('success');
  };

  const sellTower = (id: string) => {
    const tower = towersRef.current.find((t) => t.id === id);
    if (!tower) return;
    // free spot
    const key = `${tower.x}_${tower.y}`;
    occupiedSpotsRef.current[key] = false;
    // remove tower
    towersRef.current = towersRef.current.filter((t) => t.id !== id);
    // refund based on level
    const level = towerLevelsRef.current[id] || 1;
    const refund = Math.floor(TOWER_COST * 0.6 * level);
    delete towerLevelsRef.current[id];
    setGameState((prev) => ({ ...prev, gold: prev.gold + refund }));
    setSelectedTowerId(null);
    setSelectedTowerScreenPos(null);
    playSound('break');
  };

  const resetGame = () => {
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    lastSpawnTime.current = 0;
    occupiedSpotsRef.current = {};
    waveEnemiesLeftRef.current = 5 + 1 * 2;
    setSelectedTowerId(null);
    setSelectedTowerScreenPos(null);
    setGameState({
      score: 0,
      level: 1,
      gameOver: false,
      isPaused: false,
      gold: START_GOLD,
      health: START_HEALTH,
      waveCount: 1,
    });
  };

  return (
    <GameLayout gameId="tower-defense" title="Tower Defense" score={gameState.score} highScore={highScore}>
      <Helmet>
        <title>Tower Defense - Strategy Game</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center p-4 w-full">
        <div className="flex gap-8 mb-4 bg-gradient-to-r from-amber-900 to-yellow-900 p-4 rounded-lg border-2 border-yellow-700 text-white font-bold text-lg">
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            <span>{gameState.gold}</span>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: START_HEALTH }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < gameState.health ? 'fill-red-500 text-red-500' : 'text-gray-400'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span>Wave: {gameState.waveCount}</span>
          </div>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-slate-900 border-4 border-yellow-700 shadow-2xl">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto cursor-crosshair display-block"
            onClick={placeTower}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {gameState.gameOver && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-5xl font-bold mb-4">BASE DESTROYED!</h2>
              <p className="text-2xl mb-2">Final Score: {gameState.score}</p>
              <p className="text-xl mb-8 text-gray-300">Waves Survived: {gameState.waveCount}</p>
              <button
                onClick={resetGame}
                className="bg-yellow-600 hover:bg-yellow-700 px-8 py-3 rounded-lg font-bold text-lg transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Try Again
              </button>
            </div>
          )}

          {gameState.isPaused && !gameState.gameOver && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center backdrop-blur-sm">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-white mb-4">PAUSED</h2>
                <button
                  onClick={() => setGameState((prev) => ({ ...prev, isPaused: false }))}
                  className="bg-yellow-600 hover:bg-yellow-700 px-8 py-3 rounded-lg font-bold text-lg transition-colors text-white flex items-center gap-2 mx-auto"
                >
                  <Play className="w-5 h-5" /> Resume
                </button>
              </div>
            </div>
          )}

          {/* Tower selection overlay */}
          {selectedTowerId && selectedTowerScreenPos && (
            <div
              style={{ left: selectedTowerScreenPos.left, top: selectedTowerScreenPos.top }}
              className="absolute z-50 bg-white/95 p-2 rounded shadow-lg -translate-y-full"
            >
              <div className="flex flex-col items-center gap-2 text-sm">
                <div className="font-bold">Tower</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectedTowerId && upgradeTower(selectedTowerId)}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Upgrade
                  </button>
                  <button
                    onClick={() => selectedTowerId && sellTower(selectedTowerId)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Sell
                  </button>
                </div>
                <button onClick={() => { setSelectedTowerId(null); setSelectedTowerScreenPos(null); }} className="text-xs text-gray-600 mt-1">Close</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground max-w-2xl">
          <p className="mb-2 font-semibold">Click on the map to place towers ({TOWER_COST} gold each)</p>
          <p className="text-xs">Towers have a range indicator. Defeat all enemies to advance to the next wave!</p>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
            className="bg-primary hover:bg-primary/80 px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            {gameState.isPaused ? (
              <>
                <Play className="w-4 h-4" /> Resume
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Pause
              </>
            )}
          </button>
          <button
            onClick={resetGame}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 text-white"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>
    </GameLayout>
  );
};

export default TowerDefense;
