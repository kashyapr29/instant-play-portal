// Chess Game Logic - Move validation, check detection, etc.

import { Board, Piece, Position, Move, PieceColor, PieceType, Square } from './types';

export const createInitialBoard = (): Board => {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
    board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
  }
  
  // Place other pieces
  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: backRow[col], color: 'black', hasMoved: false };
    board[7][col] = { type: backRow[col], color: 'white', hasMoved: false };
  }
  
  return board;
};

export const cloneBoard = (board: Board): Board => {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
};

export const getPieceAt = (board: Board, pos: Position): Square => {
  if (pos.row < 0 || pos.row > 7 || pos.col < 0 || pos.col > 7) return null;
  return board[pos.row][pos.col];
};

export const isValidPosition = (pos: Position): boolean => {
  return pos.row >= 0 && pos.row <= 7 && pos.col >= 0 && pos.col <= 7;
};

export const getBasicMoves = (
  board: Board, 
  pos: Position, 
  piece: Piece,
  enPassantTarget: Position | null
): Position[] => {
  const moves: Position[] = [];
  const { row, col } = pos;
  const { type, color } = piece;
  
  const addMoveIfValid = (r: number, c: number, captureOnly = false, moveOnly = false): boolean => {
    if (!isValidPosition({ row: r, col: c })) return false;
    const target = board[r][c];
    
    if (captureOnly) {
      if (target && target.color !== color) {
        moves.push({ row: r, col: c });
        return true;
      }
      return false;
    }
    
    if (moveOnly) {
      if (!target) {
        moves.push({ row: r, col: c });
        return true;
      }
      return false;
    }
    
    if (!target) {
      moves.push({ row: r, col: c });
      return true;
    }
    if (target.color !== color) {
      moves.push({ row: r, col: c });
    }
    return false;
  };
  
  const addSlidingMoves = (directions: [number, number][]) => {
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (isValidPosition({ row: r, col: c })) {
        const target = board[r][c];
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          if (target.color !== color) {
            moves.push({ row: r, col: c });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };
  
  switch (type) {
    case 'pawn': {
      const direction = color === 'white' ? -1 : 1;
      const startRow = color === 'white' ? 6 : 1;
      
      // Forward move
      if (addMoveIfValid(row + direction, col, false, true)) {
        // Double move from start
        if (row === startRow) {
          addMoveIfValid(row + direction * 2, col, false, true);
        }
      }
      
      // Captures
      addMoveIfValid(row + direction, col - 1, true);
      addMoveIfValid(row + direction, col + 1, true);
      
      // En passant
      if (enPassantTarget) {
        if (row + direction === enPassantTarget.row && 
            Math.abs(col - enPassantTarget.col) === 1) {
          moves.push(enPassantTarget);
        }
      }
      break;
    }
    
    case 'knight': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightMoves) {
        addMoveIfValid(row + dr, col + dc);
      }
      break;
    }
    
    case 'bishop':
      addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;
      
    case 'rook':
      addSlidingMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
      
    case 'queen':
      addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;
      
    case 'king': {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) {
            addMoveIfValid(row + dr, col + dc);
          }
        }
      }
      break;
    }
  }
  
  return moves;
};

export const findKing = (board: Board, color: PieceColor): Position | null => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
};

export const isSquareAttacked = (
  board: Board, 
  pos: Position, 
  byColor: PieceColor
): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const moves = getBasicMoves(board, { row, col }, piece, null);
        if (moves.some(m => m.row === pos.row && m.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
};

export const isInCheck = (board: Board, color: PieceColor): boolean => {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, opponentColor);
};

export const makeMove = (board: Board, move: Move): Board => {
  const newBoard = cloneBoard(board);
  const { from, to, piece } = move;
  
  // Remove piece from original position
  newBoard[from.row][from.col] = null;
  
  // Handle en passant capture
  if (move.isEnPassant) {
    const captureRow = piece.color === 'white' ? to.row + 1 : to.row - 1;
    newBoard[captureRow][to.col] = null;
  }
  
  // Handle castling
  if (move.isCastling) {
    const isKingside = to.col > from.col;
    const rookFromCol = isKingside ? 7 : 0;
    const rookToCol = isKingside ? 5 : 3;
    const rook = newBoard[from.row][rookFromCol];
    newBoard[from.row][rookFromCol] = null;
    newBoard[from.row][rookToCol] = rook ? { ...rook, hasMoved: true } : null;
  }
  
  // Handle promotion
  if (move.isPromotion && move.promoteTo) {
    newBoard[to.row][to.col] = { type: move.promoteTo, color: piece.color, hasMoved: true };
  } else {
    newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  }
  
  return newBoard;
};

export const getLegalMoves = (
  board: Board, 
  pos: Position, 
  enPassantTarget: Position | null
): Position[] => {
  const piece = getPieceAt(board, pos);
  if (!piece) return [];
  
  let moves = getBasicMoves(board, pos, piece, enPassantTarget);
  
  // Filter out moves that leave king in check
  moves = moves.filter(to => {
    const move: Move = { from: pos, to, piece };
    
    // Check for en passant
    if (piece.type === 'pawn' && enPassantTarget && 
        to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
      move.isEnPassant = true;
    }
    
    const testBoard = makeMove(board, move);
    return !isInCheck(testBoard, piece.color);
  });
  
  // Add castling moves
  if (piece.type === 'king' && !piece.hasMoved && !isInCheck(board, piece.color)) {
    const row = piece.color === 'white' ? 7 : 0;
    
    // Kingside castling
    const kingsideRook = board[row][7];
    if (kingsideRook && kingsideRook.type === 'rook' && !kingsideRook.hasMoved) {
      if (!board[row][5] && !board[row][6] &&
          !isSquareAttacked(board, { row, col: 5 }, piece.color === 'white' ? 'black' : 'white') &&
          !isSquareAttacked(board, { row, col: 6 }, piece.color === 'white' ? 'black' : 'white')) {
        moves.push({ row, col: 6 });
      }
    }
    
    // Queenside castling
    const queensideRook = board[row][0];
    if (queensideRook && queensideRook.type === 'rook' && !queensideRook.hasMoved) {
      if (!board[row][1] && !board[row][2] && !board[row][3] &&
          !isSquareAttacked(board, { row, col: 2 }, piece.color === 'white' ? 'black' : 'white') &&
          !isSquareAttacked(board, { row, col: 3 }, piece.color === 'white' ? 'black' : 'white')) {
        moves.push({ row, col: 2 });
      }
    }
  }
  
  return moves;
};

export const getAllLegalMoves = (
  board: Board, 
  color: PieceColor, 
  enPassantTarget: Position | null
): Move[] => {
  const moves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const from = { row, col };
        const legalMoves = getLegalMoves(board, from, enPassantTarget);
        
        for (const to of legalMoves) {
          const captured = board[to.row][to.col] || undefined;
          const move: Move = { from, to, piece, captured };
          
          // Check for special moves
          if (piece.type === 'king' && Math.abs(to.col - col) === 2) {
            move.isCastling = true;
          }
          
          if (piece.type === 'pawn') {
            if (enPassantTarget && to.row === enPassantTarget.row && to.col === enPassantTarget.col) {
              move.isEnPassant = true;
              move.captured = { type: 'pawn', color: color === 'white' ? 'black' : 'white' };
            }
            
            if ((color === 'white' && to.row === 0) || (color === 'black' && to.row === 7)) {
              // Add all promotion options
              const promotionPieces: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
              for (const promoteTo of promotionPieces) {
                moves.push({ ...move, isPromotion: true, promoteTo });
              }
              continue;
            }
          }
          
          moves.push(move);
        }
      }
    }
  }
  
  return moves;
};

export const isCheckmate = (
  board: Board, 
  color: PieceColor, 
  enPassantTarget: Position | null
): boolean => {
  if (!isInCheck(board, color)) return false;
  return getAllLegalMoves(board, color, enPassantTarget).length === 0;
};

export const isStalemate = (
  board: Board, 
  color: PieceColor, 
  enPassantTarget: Position | null
): boolean => {
  if (isInCheck(board, color)) return false;
  return getAllLegalMoves(board, color, enPassantTarget).length === 0;
};
