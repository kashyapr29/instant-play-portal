// Chess AI Engine - Minimax with Alpha-Beta Pruning

import { 
  Board, Move, PieceColor, Position,
  PIECE_VALUES, PAWN_TABLE, KNIGHT_TABLE, BISHOP_TABLE, 
  ROOK_TABLE, QUEEN_TABLE, KING_TABLE, KING_ENDGAME_TABLE
} from './types';
import { getAllLegalMoves, makeMove, isInCheck, isCheckmate, isStalemate } from './logic';

// AI difficulty settings - depth and randomness factor
const AI_LEVELS: { depth: number; randomness: number; name: string }[] = [
  { depth: 1, randomness: 0.4, name: 'Beginner' },
  { depth: 1, randomness: 0.25, name: 'Novice' },
  { depth: 2, randomness: 0.2, name: 'Amateur' },
  { depth: 2, randomness: 0.1, name: 'Casual' },
  { depth: 3, randomness: 0.08, name: 'Intermediate' },
  { depth: 3, randomness: 0.04, name: 'Advanced' },
  { depth: 3, randomness: 0.02, name: 'Expert' },
  { depth: 4, randomness: 0.01, name: 'Master' },
  { depth: 4, randomness: 0.005, name: 'Grandmaster' },
  { depth: 5, randomness: 0, name: 'World Champion' },
];

export const getAILevelInfo = (level: number) => AI_LEVELS[level - 1] || AI_LEVELS[0];

const getPieceSquareValue = (
  piece: { type: string; color: string }, 
  row: number, 
  col: number,
  isEndgame: boolean
): number => {
  const isWhite = piece.color === 'white';
  const r = isWhite ? row : 7 - row;
  
  let table: number[][];
  switch (piece.type) {
    case 'pawn': table = PAWN_TABLE; break;
    case 'knight': table = KNIGHT_TABLE; break;
    case 'bishop': table = BISHOP_TABLE; break;
    case 'rook': table = ROOK_TABLE; break;
    case 'queen': table = QUEEN_TABLE; break;
    case 'king': table = isEndgame ? KING_ENDGAME_TABLE : KING_TABLE; break;
    default: return 0;
  }
  
  return table[r][col];
};

const countMaterial = (board: Board): { white: number; black: number } => {
  let white = 0, black = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const value = PIECE_VALUES[piece.type];
        if (piece.color === 'white') white += value;
        else black += value;
      }
    }
  }
  
  return { white, black };
};

const isEndgame = (board: Board): boolean => {
  const material = countMaterial(board);
  // Endgame if total material (excluding kings) is low
  return (material.white + material.black - 40000) < 2600;
};

export const evaluateBoard = (board: Board, color: PieceColor): number => {
  let score = 0;
  const endgame = isEndgame(board);
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        const pieceValue = PIECE_VALUES[piece.type];
        const positionValue = getPieceSquareValue(piece, row, col, endgame);
        const totalValue = pieceValue + positionValue;
        
        if (piece.color === color) {
          score += totalValue;
        } else {
          score -= totalValue;
        }
      }
    }
  }
  
  // Bonus for controlling center
  const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
  for (const [r, c] of centerSquares) {
    const piece = board[r][c];
    if (piece) {
      if (piece.color === color) score += 10;
      else score -= 10;
    }
  }
  
  return score;
};

// Order moves for better alpha-beta pruning (captures first, then checks)
const orderMoves = (moves: Move[], board: Board): Move[] => {
  return moves.sort((a, b) => {
    // Captures are prioritized
    const aCapture = a.captured ? PIECE_VALUES[a.captured.type] : 0;
    const bCapture = b.captured ? PIECE_VALUES[b.captured.type] : 0;
    
    // MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
    const aScore = aCapture - PIECE_VALUES[a.piece.type] / 100;
    const bScore = bCapture - PIECE_VALUES[b.piece.type] / 100;
    
    return bScore - aScore;
  });
};

const minimax = (
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  color: PieceColor,
  enPassantTarget: Position | null
): number => {
  const currentColor = isMaximizing ? color : (color === 'white' ? 'black' : 'white');
  
  // Terminal conditions
  if (isCheckmate(board, currentColor, enPassantTarget)) {
    return isMaximizing ? -100000 + (10 - depth) : 100000 - (10 - depth);
  }
  
  if (isStalemate(board, currentColor, enPassantTarget)) {
    return 0;
  }
  
  if (depth === 0) {
    return evaluateBoard(board, color);
  }
  
  let moves = getAllLegalMoves(board, currentColor, enPassantTarget);
  moves = orderMoves(moves, board);
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      
      // Calculate new en passant target
      let newEnPassant: Position | null = null;
      if (move.piece.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
        newEnPassant = {
          row: (move.from.row + move.to.row) / 2,
          col: move.from.col
        };
      }
      
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, color, newEnPassant);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move);
      
      let newEnPassant: Position | null = null;
      if (move.piece.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
        newEnPassant = {
          row: (move.from.row + move.to.row) / 2,
          col: move.from.col
        };
      }
      
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, color, newEnPassant);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getBestMove = (
  board: Board,
  color: PieceColor,
  enPassantTarget: Position | null,
  level: number
): Move | null => {
  const aiSettings = getAILevelInfo(level);
  const { depth, randomness } = aiSettings;
  
  let moves = getAllLegalMoves(board, color, enPassantTarget);
  if (moves.length === 0) return null;
  
  // Evaluate all moves
  const evaluatedMoves: { move: Move; score: number }[] = [];
  
  for (const move of moves) {
    const newBoard = makeMove(board, move);
    
    let newEnPassant: Position | null = null;
    if (move.piece.type === 'pawn' && Math.abs(move.to.row - move.from.row) === 2) {
      newEnPassant = {
        row: (move.from.row + move.to.row) / 2,
        col: move.from.col
      };
    }
    
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, color, newEnPassant);
    evaluatedMoves.push({ move, score });
  }
  
  // Sort by score
  evaluatedMoves.sort((a, b) => b.score - a.score);
  
  // Apply randomness based on level
  if (randomness > 0 && evaluatedMoves.length > 1) {
    // Calculate how many top moves to consider
    const topCount = Math.max(1, Math.floor(evaluatedMoves.length * randomness * 2));
    const topMoves = evaluatedMoves.slice(0, Math.min(topCount, evaluatedMoves.length));
    
    // Weighted random selection favoring better moves
    const weights = topMoves.map((_, i) => Math.pow(0.5, i));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < topMoves.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return topMoves[i].move;
      }
    }
  }
  
  return evaluatedMoves[0]?.move || null;
};
