import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Rocket, Trophy, Play, RotateCcw, Pause } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import { GameState, Entity, Bullet, Enemy } from './types';
import { useHighScore } from '@/hooks/useHighScore';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const PLAYER_SIZE = 40;
const BULLET_SIZE = 5;
const ENEMY_SIZE = 40;

import { useGameAudio } from '@/hooks/useGameAudio';

const SpaceShooter = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playSound } = useGameAudio();
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    level: 1,
    gameOver: false,
    isPaused: false,
    lives: 3,
  });
  
  const { highScore, updateHighScore } = useHighScore('space-shooter');
  const playerRef = useRef<Entity>({ x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT - 60, width: PLAYER_SIZE, height: PLAYER_SIZE });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const animationRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);

  const spawnEnemy = useCallback(() => {
    const x = Math.random() * (CANVAS_WIDTH - ENEMY_SIZE);
    const type = Math.random() > 0.8 ? 'fast' : 'basic';
    enemiesRef.current.push({
      x,
      y: -ENEMY_SIZE,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
      health: type === 'fast' ? 1 : 2,
      type
    });
  }, []);

  const update = useCallback((time: number) => {
    if (gameState.gameOver || gameState.isPaused) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Spawn enemies
    if (time - lastSpawnTime.current > 2000 / gameState.level) {
      spawnEnemy();
      lastSpawnTime.current = time;
    }

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter(b => b.y > 0 && b.active);
    bulletsRef.current.forEach(b => {
      b.y -= 7;
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(b.x, b.y, b.width, b.height);
    });

    // Update enemies
    enemiesRef.current = enemiesRef.current.filter(e => e.y < CANVAS_HEIGHT && e.health > 0);
    enemiesRef.current.forEach(e => {
      e.y += e.type === 'fast' ? 4 : 2;
      ctx.fillStyle = e.type === 'fast' ? '#ff00ff' : '#ff0000';
      ctx.fillRect(e.x, e.y, e.width, e.height);

      // Collision with player
      if (
        e.x < playerRef.current.x + PLAYER_SIZE &&
        e.x + ENEMY_SIZE > playerRef.current.x &&
        e.y < playerRef.current.y + PLAYER_SIZE &&
        e.y + ENEMY_SIZE > playerRef.current.y
      ) {
        setGameState(prev => ({ ...prev, lives: prev.lives - 1, gameOver: prev.lives <= 1 }));
        e.health = 0;
      }

      // Collision with bullets
      bulletsRef.current.forEach(b => {
        if (
          b.active &&
          b.x < e.x + ENEMY_SIZE &&
          b.x + BULLET_SIZE > e.x &&
          b.y < e.y + ENEMY_SIZE &&
          b.y + BULLET_SIZE > e.y
        ) {
          b.active = false;
          e.health -= 1;
          if (e.health <= 0) {
            playSound('explosion');
            setGameState(prev => {
              const newScore = prev.score + 10;
              const newLevel = Math.floor(newScore / 100) + 1;
              return { ...prev, score: newScore, level: newLevel };
            });
          }
        }
      });
    });

    // Draw player
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, PLAYER_SIZE, PLAYER_SIZE);

    animationRef.current = requestAnimationFrame(update);
  }, [gameState, spawnEnemy]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [update]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      playerRef.current.x = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, e.clientX - rect.left - PLAYER_SIZE / 2));
    }
  };

  const handleClick = () => {
    if (gameState.gameOver || gameState.isPaused) return;
    playSound('shoot');
    bulletsRef.current.push({
      x: playerRef.current.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
      y: playerRef.current.y,
      width: BULLET_SIZE,
      height: 15,
      active: true
    });
  };

  return (
    <GameLayout gameId="space-shooter" title="Space Defender" score={gameState.score} highScore={highScore}>
      <Helmet>
        <title>Space Defender - Action Game</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center p-4">
        <div className="relative border-4 border-primary rounded-lg overflow-hidden bg-black" onMouseMove={handleMouseMove} onClick={handleClick}>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto cursor-crosshair" />
          
          {gameState.gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
              <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="text-4xl font-bold mb-2">Game Over</h2>
              <p className="text-xl mb-6">Final Score: {gameState.score}</p>
              <button onClick={() => window.location.reload()} className="bg-primary px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                Restart Mission
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-8 text-xl font-bold">
          <div className="text-primary">Level: {gameState.level}</div>
          <div className="text-red-500">Lives: {'❤️'.repeat(gameState.lives)}</div>
        </div>
      </div>
    </GameLayout>
  );
};

export default SpaceShooter;
