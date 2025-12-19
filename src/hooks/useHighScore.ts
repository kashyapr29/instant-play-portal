import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'game_high_scores';

interface HighScores {
  [gameId: string]: number;
}

export const useHighScore = (gameId: string) => {
  const [highScore, setHighScore] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const scores: HighScores = JSON.parse(stored);
      setHighScore(scores[gameId] || 0);
    }
  }, [gameId]);

  const updateHighScore = useCallback((newScore: number) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const scores: HighScores = stored ? JSON.parse(stored) : {};
    
    if (newScore > (scores[gameId] || 0)) {
      scores[gameId] = newScore;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
      setHighScore(newScore);
      return true; // New high score!
    }
    return false;
  }, [gameId]);

  return { highScore, updateHighScore };
};

export const getAllHighScores = (): HighScores => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};
