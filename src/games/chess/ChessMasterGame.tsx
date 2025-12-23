import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Volume2, VolumeX, Home, RotateCcw, Users, Bot, ChevronLeft, Crown, Clock, Trophy } from 'lucide-react';
import GameLayout from '@/components/GameLayout';
import ChessPiece from './pieces';
import { GameState, GameMode, Position, Move, PieceColor, PieceType } from './types';
import { createInitialBoard, getLegalMoves, makeMove, isInCheck, isCheckmate, isStalemate, getAllLegalMoves } from './logic';
import { getBestMove, getAILevelInfo } from './ai';
import { chessAudio } from './audio';

const SQUARE_SIZE = 70;

const ChessMasterGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    currentPlayer: 'white',
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    status: 'playing',
    winner: null,
    enPassantTarget: null,
    aiLevel: 1,
    gameMode: 'menu',
    isThinking: false,
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [promotionPending, setPromotionPending] = useState<{ from: Position; to: Position } | null>(null);

  useEffect(() => {
    chessAudio.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const resetGame = useCallback((mode: GameMode, level?: number) => {
    chessAudio.gameStart();
    setGameState({
      board: createInitialBoard(),
      currentPlayer: 'white',
      selectedSquare: null,
      validMoves: [],
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      status: 'playing',
      winner: null,
      enPassantTarget: null,
      aiLevel: level || gameState.aiLevel,
      gameMode: mode,
      isThinking: false,
    });
    setPromotionPending(null);
  }, [gameState.aiLevel]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameState.status !== 'playing' || gameState.isThinking) return;
    if (gameState.gameMode === 'pvc' && gameState.currentPlayer === 'black') return;

    const clickedPiece = gameState.board[row][col];
    const { selectedSquare, validMoves, currentPlayer } = gameState;

    // If clicking on own piece, select it
    if (clickedPiece && clickedPiece.color === currentPlayer) {
      chessAudio.select();
      const moves = getLegalMoves(gameState.board, { row, col }, gameState.enPassantTarget);
      setGameState(prev => ({
        ...prev,
        selectedSquare: { row, col },
        validMoves: moves,
      }));
      return;
    }

    // If a piece is selected and clicking on a valid move
    if (selectedSquare && validMoves.some(m => m.row === row && m.col === col)) {
      const piece = gameState.board[selectedSquare.row][selectedSquare.col]!;
      
      // Check for pawn promotion
      if (piece.type === 'pawn' && ((currentPlayer === 'white' && row === 0) || (currentPlayer === 'black' && row === 7))) {
        setPromotionPending({ from: selectedSquare, to: { row, col } });
        return;
      }

      executeMove(selectedSquare, { row, col });
    } else {
      // Deselect
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        validMoves: [],
      }));
    }
  }, [gameState]);

  const executeMove = useCallback((from: Position, to: Position, promoteTo?: PieceType) => {
    const piece = gameState.board[from.row][from.col]!;
    const captured = gameState.board[to.row][to.col];
    
    const move: Move = {
      from,
      to,
      piece,
      captured: captured || undefined,
    };

    // Check for special moves
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      move.isCastling = true;
      chessAudio.castle();
    } else if (piece.type === 'pawn' && gameState.enPassantTarget && 
               to.row === gameState.enPassantTarget.row && to.col === gameState.enPassantTarget.col) {
      move.isEnPassant = true;
      move.captured = { type: 'pawn', color: piece.color === 'white' ? 'black' : 'white' };
      chessAudio.capture();
    } else if (promoteTo) {
      move.isPromotion = true;
      move.promoteTo = promoteTo;
      chessAudio.capture();
    } else if (captured) {
      chessAudio.capture();
    } else {
      chessAudio.move();
    }

    const newBoard = makeMove(gameState.board, move);
    const nextPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';

    // Update en passant target
    let newEnPassant: Position | null = null;
    if (piece.type === 'pawn' && Math.abs(to.row - from.row) === 2) {
      newEnPassant = {
        row: (from.row + to.row) / 2,
        col: from.col
      };
    }

    // Update captured pieces
    const newCaptured = { ...gameState.capturedPieces };
    if (move.captured) {
      newCaptured[move.captured.color].push(move.captured);
    }

    // Check game status
    let status = gameState.status;
    let winner = gameState.winner;

    if (isCheckmate(newBoard, nextPlayer, newEnPassant)) {
      status = 'checkmate';
      winner = gameState.currentPlayer;
      chessAudio.checkmate();
    } else if (isStalemate(newBoard, nextPlayer, newEnPassant)) {
      status = 'stalemate';
    } else if (isInCheck(newBoard, nextPlayer)) {
      status = 'check';
      chessAudio.check();
    } else {
      status = 'playing';
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedSquare: null,
      validMoves: [],
      moveHistory: [...prev.moveHistory, move],
      capturedPieces: newCaptured,
      status,
      winner,
      enPassantTarget: newEnPassant,
    }));

    setPromotionPending(null);
  }, [gameState]);

  const handlePromotion = useCallback((pieceType: PieceType) => {
    if (!promotionPending) return;
    executeMove(promotionPending.from, promotionPending.to, pieceType);
  }, [promotionPending, executeMove]);

  // AI move
  useEffect(() => {
    if (gameState.gameMode !== 'pvc' || gameState.currentPlayer !== 'black' || 
        gameState.status === 'checkmate' || gameState.status === 'stalemate' || gameState.isThinking) {
      return;
    }

    setGameState(prev => ({ ...prev, isThinking: true }));

    const timer = setTimeout(() => {
      const aiMove = getBestMove(gameState.board, 'black', gameState.enPassantTarget, gameState.aiLevel);
      
      if (aiMove) {
        const newBoard = makeMove(gameState.board, aiMove);
        const nextPlayer = 'white';

        let newEnPassant: Position | null = null;
        if (aiMove.piece.type === 'pawn' && Math.abs(aiMove.to.row - aiMove.from.row) === 2) {
          newEnPassant = {
            row: (aiMove.from.row + aiMove.to.row) / 2,
            col: aiMove.from.col
          };
        }

        const newCaptured = { ...gameState.capturedPieces };
        if (aiMove.captured) {
          newCaptured[aiMove.captured.color].push(aiMove.captured);
        }

        let status = gameState.status;
        let winner = gameState.winner;

        if (isCheckmate(newBoard, nextPlayer, newEnPassant)) {
          status = 'checkmate';
          winner = 'black';
          chessAudio.checkmate();
        } else if (isStalemate(newBoard, nextPlayer, newEnPassant)) {
          status = 'stalemate';
        } else if (isInCheck(newBoard, nextPlayer)) {
          status = 'check';
          chessAudio.check();
        } else {
          status = 'playing';
        }

        if (aiMove.isCastling) chessAudio.castle();
        else if (aiMove.captured) chessAudio.capture();
        else chessAudio.move();

        setGameState(prev => ({
          ...prev,
          board: newBoard,
          currentPlayer: nextPlayer,
          moveHistory: [...prev.moveHistory, aiMove],
          capturedPieces: newCaptured,
          status,
          winner,
          enPassantTarget: newEnPassant,
          isThinking: false,
        }));
      } else {
        setGameState(prev => ({ ...prev, isThinking: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gameState.currentPlayer, gameState.gameMode, gameState.status, gameState.isThinking]);

  const renderBoard = () => {
    const squares = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const isLight = (row + col) % 2 === 0;
        const piece = gameState.board[row][col];
        const isSelected = gameState.selectedSquare?.row === row && gameState.selectedSquare?.col === col;
        const isValidMove = gameState.validMoves.some(m => m.row === row && m.col === col);
        const isCapture = isValidMove && piece !== null;
        
        // Check highlight
        const isInCheckSquare = (gameState.status === 'check' || gameState.status === 'checkmate') && 
          piece?.type === 'king' && piece?.color === gameState.currentPlayer;

        squares.push(
          <div
            key={`${row}-${col}`}
            onClick={() => handleSquareClick(row, col)}
            className={`
              relative flex items-center justify-center cursor-pointer transition-all duration-150
              ${isLight ? 'bg-[#EEEED2]' : 'bg-[#769656]'}
              ${isSelected ? 'ring-4 ring-yellow-400 ring-inset z-10' : ''}
              ${isInCheckSquare ? 'bg-red-500/70' : ''}
            `}
            style={{ width: SQUARE_SIZE, height: SQUARE_SIZE }}
          >
            {/* Coordinate labels */}
            {col === 0 && (
              <span className={`absolute top-0.5 left-1 text-xs font-bold ${isLight ? 'text-[#769656]' : 'text-[#EEEED2]'}`}>
                {8 - row}
              </span>
            )}
            {row === 7 && (
              <span className={`absolute bottom-0.5 right-1 text-xs font-bold ${isLight ? 'text-[#769656]' : 'text-[#EEEED2]'}`}>
                {String.fromCharCode(97 + col)}
              </span>
            )}

            {/* Valid move indicator */}
            {isValidMove && !isCapture && (
              <div className="absolute w-4 h-4 rounded-full bg-black/20" />
            )}
            {isCapture && (
              <div className="absolute inset-1 rounded-full border-4 border-black/20" />
            )}

            {/* Piece */}
            {piece && (
              <div className={`transform transition-transform ${isSelected ? 'scale-110' : 'hover:scale-105'}`}>
                <ChessPiece type={piece.type} color={piece.color} size={SQUARE_SIZE - 10} />
              </div>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  const renderMenu = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-900 via-amber-800 to-amber-900 rounded-lg">
      <div className="mb-8 text-center">
        <Crown className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">Chess Master</h1>
        <p className="text-amber-200">The Ultimate Strategic Battle</p>
      </div>

      <div className="flex flex-col gap-4 w-72">
        <button
          onClick={() => resetGame('pvp')}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
        >
          <Users className="w-6 h-6" />
          Player vs Player
        </button>
        
        <button
          onClick={() => setGameState(prev => ({ ...prev, gameMode: 'levelSelect' }))}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
        >
          <Bot className="w-6 h-6" />
          Player vs Computer
        </button>
      </div>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="absolute inset-0 flex flex-col items-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg p-6 overflow-auto">
      <button
        onClick={() => setGameState(prev => ({ ...prev, gameMode: 'menu' }))}
        className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <h2 className="text-3xl font-bold text-white mb-6 mt-4">Select Difficulty</h2>
      
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {Array.from({ length: 10 }, (_, i) => {
          const level = i + 1;
          const info = getAILevelInfo(level);
          const colors = [
            'from-green-500 to-green-600',
            'from-green-600 to-green-700',
            'from-lime-500 to-lime-600',
            'from-yellow-500 to-yellow-600',
            'from-amber-500 to-amber-600',
            'from-orange-500 to-orange-600',
            'from-red-500 to-red-600',
            'from-rose-600 to-rose-700',
            'from-purple-600 to-purple-700',
            'from-violet-700 to-violet-800',
          ];

          return (
            <button
              key={level}
              onClick={() => resetGame('pvc', level)}
              className={`flex flex-col items-center px-4 py-3 bg-gradient-to-r ${colors[i]} text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg`}
            >
              <span className="text-lg">Level {level}</span>
              <span className="text-xs opacity-80">{info.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCapturedPieces = (color: PieceColor) => {
    const pieces = gameState.capturedPieces[color];
    return (
      <div className="flex flex-wrap gap-1 min-h-[30px]">
        {pieces.map((piece, i) => (
          <div key={i} className="w-6 h-6">
            <ChessPiece type={piece.type} color={piece.color} size={24} />
          </div>
        ))}
      </div>
    );
  };

  const renderGameInfo = () => (
    <div className="flex flex-col gap-4 p-4 bg-slate-800 rounded-lg min-w-[200px]">
      {/* Current player */}
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-1">Current Turn</p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          gameState.currentPlayer === 'white' ? 'bg-white text-black' : 'bg-slate-900 text-white'
        }`}>
          <div className={`w-4 h-4 rounded-full ${gameState.currentPlayer === 'white' ? 'bg-gray-300 border border-gray-400' : 'bg-gray-800 border border-gray-600'}`} />
          <span className="font-bold capitalize">{gameState.currentPlayer}</span>
        </div>
        {gameState.isThinking && (
          <p className="text-amber-400 mt-2 animate-pulse">AI is thinking...</p>
        )}
      </div>

      {/* Status */}
      {gameState.status !== 'playing' && (
        <div className={`text-center p-3 rounded-lg ${
          gameState.status === 'check' ? 'bg-yellow-500/20 text-yellow-400' :
          gameState.status === 'checkmate' ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          <p className="font-bold text-lg uppercase">{gameState.status}</p>
          {gameState.winner && (
            <p className="text-sm mt-1">{gameState.winner.charAt(0).toUpperCase() + gameState.winner.slice(1)} wins!</p>
          )}
        </div>
      )}

      {/* Captured pieces */}
      <div>
        <p className="text-slate-400 text-sm mb-2">Captured by White</p>
        {renderCapturedPieces('white')}
      </div>
      <div>
        <p className="text-slate-400 text-sm mb-2">Captured by Black</p>
        {renderCapturedPieces('black')}
      </div>

      {/* Game mode info */}
      <div className="text-center text-slate-400 text-sm">
        {gameState.gameMode === 'pvp' ? (
          <span>Player vs Player</span>
        ) : (
          <span>Level {gameState.aiLevel}: {getAILevelInfo(gameState.aiLevel).name}</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => resetGame(gameState.gameMode, gameState.aiLevel)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
        <button
          onClick={() => setGameState(prev => ({ ...prev, gameMode: 'menu' }))}
          className="flex items-center justify-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderPromotionDialog = () => {
    if (!promotionPending) return null;
    
    const pieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
        <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
          <h3 className="text-white text-lg font-bold mb-4 text-center">Choose Promotion</h3>
          <div className="flex gap-4">
            {pieces.map(type => (
              <button
                key={type}
                onClick={() => handlePromotion(type)}
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all hover:scale-110"
              >
                <ChessPiece type={type} color={gameState.currentPlayer} size={50} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <GameLayout
      gameId="chess-master"
      title="Chess Master"
      score={gameState.moveHistory.length}
      highScore={0}
      isMuted={!soundEnabled}
      onToggleMute={() => setSoundEnabled(!soundEnabled)}
      showAudioControl
    >
      <Helmet>
        <title>Chess Master - Play Chess Online</title>
        <meta name="description" content="Play chess against friends or AI with 10 difficulty levels. Beautiful graphics and smart computer opponent!" />
      </Helmet>

      <div className="flex gap-6 items-start">
        <div className="relative" style={{ width: SQUARE_SIZE * 8, height: SQUARE_SIZE * 8 }}>
          {/* Board border */}
          <div className="absolute -inset-2 bg-amber-900 rounded-lg shadow-2xl" />
          
          {/* Board */}
          <div 
            className="relative grid grid-cols-8 rounded-sm overflow-hidden shadow-inner"
            style={{ width: SQUARE_SIZE * 8, height: SQUARE_SIZE * 8 }}
          >
            {(gameState.gameMode === 'pvp' || gameState.gameMode === 'pvc') && renderBoard()}
          </div>

          {gameState.gameMode === 'menu' && renderMenu()}
          {gameState.gameMode === 'levelSelect' && renderLevelSelect()}
          {promotionPending && renderPromotionDialog()}
        </div>

        {(gameState.gameMode === 'pvp' || gameState.gameMode === 'pvc') && renderGameInfo()}
      </div>
    </GameLayout>
  );
};

export default ChessMasterGame;
