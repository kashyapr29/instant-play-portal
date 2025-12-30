import { useRef, useEffect, useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { useTetris, STAGE_HEIGHT, STAGE_WIDTH } from './useTetris.ts';
import { TETROMINOES } from './tetrominoes.ts';
import { Button } from '@/components/ui/button';
import { Play, RotateCw, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';

// Enhanced Cell component with 3D effects
const Cell = ({ type, isClearing }: { type: keyof typeof TETROMINOES | 0; isClearing?: boolean }) => {
  const color = type === 0 ? '0, 0, 0' : TETROMINOES[type].color;
  const isFilled = type !== 0;
  
  return (
    <div
      className={`w-full h-full border transition-all duration-300 ${
        isClearing ? 'animate-pulse scale-110' : ''
      }`}
      style={{
        backgroundColor: isFilled 
          ? `hsl(${color})` 
          : 'rgba(0,0,0,0.2)',
        boxShadow: isFilled 
          ? `
              inset -2px -2px 4px rgba(0,0,0,0.4),
              inset 2px 2px 4px rgba(255,255,255,0.1),
              0 0 12px hsl(${color} / 0.6),
              0 4px 8px rgba(0,0,0,0.3)
            ` 
          : 'inset 0 0 2px rgba(0,0,0,0.3)',
        border: isFilled ? `2px solid hsl(${color} / 0.8)` : '1px solid rgba(255,255,255,0.05)',
        borderRadius: '3px',
        opacity: isClearing ? 0 : 1,
      }}
    />
  );
};

const TetrisGame = () => {
  const { stage, startGame, gameOver, score, level, move, keyUp, dropPlayer, gameStarted } = useTetris();
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const { playSound, isMuted, toggleMute } = useGameAudio();
  const [clearingRows, setClearingRows] = useState<Set<number>>(new Set());

  // Focus management
  useEffect(() => {
    if (gameAreaRef.current) {
      gameAreaRef.current.focus();
    }
  }, []);

  // Detect when rows are cleared and trigger animation
  useEffect(() => {
    const detectClearedRows = () => {
      const filled = new Set<number>();
      stage.forEach((row, idx) => {
        if (row.every((cell: any[]) => cell[0] !== 0)) {
          filled.add(idx);
        }
      });
      if (filled.size > 0) {
        setClearingRows(filled);
        playSound('move');
        setTimeout(() => {
          setClearingRows(new Set());
        }, 500);
      }
    };
    detectClearedRows();
  }, [stage, playSound]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!gameOver) {
      // Prevent default scrolling for arrow keys
      if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
      }
      move({ keyCode: e.keyCode });
      if (e.keyCode === 38 || e.keyCode === 40) playSound('move'); // Simple sound trigger mock
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!gameOver) {
      keyUp({ keyCode: e.keyCode });
    }
  };

  // Mobile controls
  const handleMove = (dir: number) => {
    move({ keyCode: dir === -1 ? 37 : 39 });
    playSound('move');
  };
  
  const handleRotate = () => {
    move({ keyCode: 38 });
    playSound('move');
  };
  
  const handleDrop = () => {
    dropPlayer();
    playSound('move');
  };

  return (
    <GameLayout
      gameId="tetris"
      title="Block Stack"
      score={score}
      highScore={level * 1000} // Placeholder high score logic
      isMuted={isMuted}
      onToggleMute={toggleMute}
      showAudioControl
    >
      <div 
        className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto gap-8 outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        ref={gameAreaRef}
        autoFocus
      >
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
          
          {/* Game Board */}
          <div className="relative p-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-4 border-slate-700/50 shadow-2xl backdrop-blur-sm hover:border-slate-600/75 transition-all">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />
            <div 
              className="grid gap-[2px] bg-gradient-to-b from-slate-900/80 to-black/50 w-[250px] h-[500px] sm:w-[300px] sm:h-[600px] rounded-lg relative z-10"
              style={{
                gridTemplateColumns: `repeat(${STAGE_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${STAGE_HEIGHT}, 1fr)`,
              }}
            >
              {stage.map((row, rowIdx) =>
                row.map((cell, x) => (
                  <Cell key={`${rowIdx}-${x}`} type={cell[0] as any} isClearing={clearingRows.has(rowIdx)} />
                ))
              )}
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-20 rounded-lg border border-red-500/30">
                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-500 animate-pulse">
                    GAME OVER
                  </h2>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-white">Score: {score}</p>
                    <p className="text-xl text-slate-300">Level: {level + 1}</p>
                    <p className="text-lg text-slate-400">Rows: {score / 10}</p>
                  </div>
                  <Button 
                    onClick={startGame} 
                    size="lg" 
                    className="mt-6 gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-6 px-8 text-lg shadow-lg shadow-red-500/50"
                  >
                    <RefreshCw className="w-6 h-6" />
                    Play Again
                  </Button>
                </div>
              </div>
            )}

            {/* Start Game Overlay */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-20 rounded-lg border border-blue-500/30">
                <div className="text-center space-y-6">
                  <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                    TETRIS
                  </h2>
                  <Button 
                    onClick={startGame} 
                    size="lg" 
                    className="text-xl px-8 py-6 gap-2 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold"
                  >
                    <Play className="w-6 h-6" />
                    Start Game
                  </Button>
                  <p className="text-sm text-slate-300 mt-4">Use Arrow Keys or Buttons to Play</p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>↑ Rotate • ← → Move • ↓ Drop</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats & Controls Panel */}
          <div className="flex flex-col gap-6 w-full md:w-80">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-xl p-6 shadow-xl hover:border-slate-600 transition-all">
              <h3 className="text-lg font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                SCORE
              </h3>
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4 border border-slate-700/30">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Current</p>
                  <p className="text-4xl font-mono font-bold text-blue-400 mt-2">{score}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400">Level</p>
                    <p className="text-2xl font-mono font-bold text-purple-400 mt-1">{level + 1}</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 border border-slate-700/30">
                    <p className="text-xs text-slate-400">Rows</p>
                    <p className="text-2xl font-mono font-bold text-cyan-400 mt-1">{Math.floor(score / 100)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Info */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-xl p-6 shadow-xl hidden md:block">
              <h3 className="text-lg font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                Controls
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-slate-300">Rotate</span> 
                  <kbd className="bg-slate-900/80 border border-slate-600/50 px-3 py-1 rounded font-mono text-xs font-bold text-cyan-400">↑</kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-300">Move Left</span> 
                  <kbd className="bg-slate-900/80 border border-slate-600/50 px-3 py-1 rounded font-mono text-xs font-bold text-cyan-400">←</kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-300">Move Right</span> 
                  <kbd className="bg-slate-900/80 border border-slate-600/50 px-3 py-1 rounded font-mono text-xs font-bold text-cyan-400">→</kbd>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-300">Drop</span> 
                  <kbd className="bg-slate-900/80 border border-slate-600/50 px-3 py-1 rounded font-mono text-xs font-bold text-cyan-400">↓</kbd>
                </li>
              </ul>
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 md:hidden w-full">
              <div className="col-start-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="w-full h-16 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 hover:from-slate-600 hover:to-slate-700" 
                  onClick={handleRotate}
                >
                  <RotateCw className="w-6 h-6" />
                </Button>
              </div>
              <div className="col-start-1 row-start-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="w-full h-16 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 hover:from-slate-600 hover:to-slate-700" 
                  onClick={() => handleMove(-1)}
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
              </div>
              <div className="col-start-2 row-start-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="w-full h-16 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 hover:from-slate-600 hover:to-slate-700" 
                  onClick={handleDrop}
                >
                  <ArrowDown className="w-6 h-6" />
                </Button>
              </div>
              <div className="col-start-3 row-start-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="w-full h-16 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 hover:from-slate-600 hover:to-slate-700" 
                  onClick={() => handleMove(1)}
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default TetrisGame;
