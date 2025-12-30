// Types
export interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export type GameState = 'playing' | 'won' | 'lost' | 'idle';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY_SETTINGS: Record<Difficulty, { boardSize: number; mineCount: number }> = {
  easy: { boardSize: 8, mineCount: 10 },
  medium: { boardSize: 10, mineCount: 15 },
  hard: { boardSize: 12, mineCount: 30 }
};

export const BOARD_SIZE = 10;
export const MINE_COUNT = 15;

export const createBoard = (size: number, mines: number, firstClickX?: number, firstClickY?: number): Cell[][] => {
  // 1. Initialize empty board
  const board: Cell[][] = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => ({
      x,
      y,
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );

  // 2. Place mines
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);

    // Don't place mine on existing mine
    if (board[y][x].isMine) continue;

    // Don't place mine on first click or neighbors (to ensure safe start)
    if (firstClickX !== undefined && firstClickY !== undefined) {
      if (Math.abs(x - firstClickX) <= 1 && Math.abs(y - firstClickY) <= 1) continue;
    }

    board[y][x].isMine = true;
    minesPlaced++;
  }

  // 3. Calculate neighbor counts
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!board[y][x].isMine) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < size && nx >= 0 && nx < size && board[ny][nx].isMine) {
              count++;
            }
          }
        }
        board[y][x].neighborMines = count;
      }
    }
  }

  return board;
};

export const revealCell = (board: Cell[][], x: number, y: number): { board: Cell[][], gameOver: boolean, win: boolean } => {
  const newBoard = JSON.parse(JSON.stringify(board)); // Deep copy
  const cell = newBoard[y][x];

  if (cell.isRevealed || cell.isFlagged) return { board: newBoard, gameOver: false, win: false };

  cell.isRevealed = true;

  if (cell.isMine) {
    // Game Over - Reveal all mines
    newBoard.forEach((row: Cell[]) => row.forEach((c: Cell) => {
      if (c.isMine) c.isRevealed = true;
    }));
    return { board: newBoard, gameOver: true, win: false };
  }

  // Flood fill if empty
  if (cell.neighborMines === 0) {
    const stack = [{ x, y }];
    while (stack.length > 0) {
      const current = stack.pop()!;
      
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = current.y + dy;
          const nx = current.x + dx;
          
          if (ny >= 0 && ny < BOARD_SIZE && nx >= 0 && nx < BOARD_SIZE) {
            const neighbor = newBoard[ny][nx];
            if (!neighbor.isRevealed && !neighbor.isFlagged && !neighbor.isMine) {
              neighbor.isRevealed = true;
              if (neighbor.neighborMines === 0) {
                stack.push({ x: nx, y: ny });
              }
            }
          }
        }
      }
    }
  }

  // Check Win
  let unrevealedNonMines = 0;
  newBoard.forEach((row: Cell[]) => row.forEach((c: Cell) => {
    if (!c.isMine && !c.isRevealed) unrevealedNonMines++;
  }));

  return { board: newBoard, gameOver: false, win: unrevealedNonMines === 0 };
};

export const toggleFlag = (board: Cell[][], x: number, y: number): Cell[][] => {
  const newBoard = JSON.parse(JSON.stringify(board));
  if (!newBoard[y][x].isRevealed) {
    newBoard[y][x].isFlagged = !newBoard[y][x].isFlagged;
  }
  return newBoard;
};
