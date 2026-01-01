import { useState, useEffect, useCallback } from 'react';
import { TETROMINOES, randomTetromino } from './tetrominoes';

export const STAGE_WIDTH = 10;
export const STAGE_HEIGHT = 20;

export const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

export const useTetris = () => {
  const [stage, setStage] = useState(createStage());
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rowsCleared, setRowsCleared] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [clearedRows, setClearedRows] = useState<number[]>([]);

  const [player, setPlayer] = useState<{
    pos: { x: number; y: number };
    tetromino: (string | number)[][];
    collided: boolean;
  }>({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES[0].shape,
    collided: false,
  });

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const startGame = () => {
    // Reset everything
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRowsCleared(0);
    setLevel(0);
    setGameStarted(true);
    setClearedRows([]);
  };

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    });
  }, []);

  const drop = () => {
    // Increase level when player has cleared 10 rows
    if (rowsCleared > (level + 1) * 10) {
      setLevel((prev) => prev + 1);
      // Also increase speed
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Game Over
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const keyUp = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      // Activate the interval again when user releases down arrow
      if (keyCode === 40) {
        setDropTime(1000 / (level + 1) + 200);
      }
    }
  };

  const dropPlayer = () => {
    setDropTime(null);
    drop();
  };

  const move = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      if (keyCode === 37) {
        movePlayer(-1);
      } else if (keyCode === 39) {
        movePlayer(1);
      } else if (keyCode === 40) {
        dropPlayer();
      } else if (keyCode === 38) {
        playerRotate(stage, 1);
      }
    }
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer((prev) => ({
      ...prev,
      pos: { x: (prev.pos.x += x), y: (prev.pos.y += y) },
      collided,
    }));
  };

  const playerRotate = (stage: any[], dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino[0].length) {
        rotate(clonedPlayer.tetromino, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  const rotate = (matrix: any[], dir: number) => {
    // Make the rows to become cols (transpose)
    const rotatedTetro = matrix.map((_, index) =>
      matrix.map((col) => col[index])
    );
    // Reverse each row to get a rotated matrix
    if (dir > 0) return rotatedTetro.map((row) => row.reverse());
    return rotatedTetro.reverse();
  };

  const checkCollision = (player: any, stage: any[], { x: moveX, y: moveY }: { x: number; y: number }) => {
    for (let y = 0; y < player.tetromino.length; y += 1) {
      for (let x = 0; x < player.tetromino[y].length; x += 1) {
        // 1. Check that we're on an actual Tetromino cell
        if (player.tetromino[y][x] !== 0) {
          if (
            // 2. Check that our move is inside the game areas height (y)
            // We shouldn't go through the bottom of the play area
            !stage[y + player.pos.y + moveY] ||
            // 3. Check that our move is inside the game areas width (x)
            !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
            // 4. Check that the cell were moving to isn't set to clear
            stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !==
              'clear'
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const sweepRows = (newStage: any[]) => {
      const rowsToRemove: number[] = [];
      return newStage.reduce((ack, row, idx) => {
        if (row.findIndex((cell: any[]) => cell[0] === 0) === -1) {
          rowsToRemove.push(idx);
          setRowsCleared((prev) => prev + 1);
          setScore((prev) => prev + 100 * (level + 1)); // Score calc
          ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
          return ack;
        }
        ack.push(row);
        return ack;
      }, []);
    };

    const updateStage = (prevStage: any[]) => {
      // First flush the stage from the previous render
      const newStage = prevStage.map((row) =>
        row.map((cell: any[]) => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      );

      // Then draw the tetromino
      player.tetromino.forEach((row: any[], y: number) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              `${player.collided ? 'merged' : 'clear'}`,
            ];
          }
        });
      });

      // Then check if it collided
      if (player.collided) {
        resetPlayer();
        return sweepRows(newStage);
      }

      return newStage;
    };

    setStage((prev) => updateStage(prev));
  }, [player, resetPlayer, level]);

  // UseInterval hook logic inside
  useEffect(() => {
    if (!dropTime) return;
    const interval = setInterval(() => {
      drop();
    }, dropTime);
    return () => clearInterval(interval);
  }, [dropTime, drop, level]); // Dependencies for drop interval

  return {
    stage,
    startGame,
    gameOver,
    score,
    level,
    rowsCleared,
    move,
    keyUp,
    dropPlayer,
    gameStarted,
    clearedRows,
  };
};
