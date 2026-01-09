import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import PlayGame from "./pages/PlayGame";
import Developers from "./pages/Developers";
import Affiliates from "./pages/Affiliates";
import Contact from "./pages/Contact";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

// Playable Games
import SnakeGame from "./games/SnakeGame";
import SpaceShooter from "./games/space-shooter/SpaceShooter";
import MemoryGame from "./games/MemoryGame";
import TicTacToe from "./games/TicTacToe";
import ClickerGame from "./games/ClickerGame";
import BreakoutGame from "./games/BreakoutGame";
import Game2048 from "./games/Game2048";
import NinjaJumpGame from "./games/NinjaJumpGame";
import ChessMasterGame from "./games/ChessMasterGame";
import TetrisGame from "./games/tetris/TetrisGame";
import MinesweeperGame from "./games/minesweeper/MinesweeperGame";
import TowerDefense from "./games/tower-defense/TowerDefense";
import TennisHeroGame from "./games/tennis/TennisHeroGame";
import BadmintonSmashGame from "./games/badminton/BadmintonSmashGame";
import PingPongProGame from "./games/tabletennis/PingPongProGame";
import PickleballChampionGame from "./games/pickleball/PickleballChampionGame";
import ZombieSurvival from "./games/zombie-survival/ZombieSurvival";
import TankCommander from "./games/tank-commander/TankCommander";
import CyberCombat from "./games/cyber-combat/CyberCombat";
import ShadowNinjaFight from "./games/shadow-ninja/ShadowNinjaFight";
import RacingThunderGame from "./games/racing-thunder/RacingThunderGame";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/play/:gameId" element={<PlayGame />} />
            
            {/* Playable Games */}
            <Route path="/game/snake" element={<SnakeGame />} />
            <Route path="/game/space-shooter" element={<SpaceShooter />} />
            <Route path="/game/tower-defense" element={<TowerDefense />} />
            <Route path="/game/snake-game" element={<SnakeGame />} />
            <Route path="/game/memory" element={<MemoryGame />} />
            <Route path="/game/memory-match" element={<MemoryGame />} />
            <Route path="/game/tictactoe" element={<TicTacToe />} />
            <Route path="/game/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/game/clicker" element={<ClickerGame />} />
            <Route path="/game/click-quest" element={<ClickerGame />} />
            <Route path="/game/breakout" element={<BreakoutGame />} />
            <Route path="/game/2048" element={<Game2048 />} />
            <Route path="/game/ninja-jump" element={<NinjaJumpGame />} />
            <Route path="/game/chess-master" element={<ChessMasterGame />} />
            <Route path="/game/tetris" element={<TetrisGame />} />
            <Route path="/game/minesweeper" element={<MinesweeperGame />} />
            <Route path="/game/tennis-hero" element={<TennisHeroGame />} />
            <Route path="/game/badminton-smash" element={<BadmintonSmashGame />} />
            <Route path="/game/ping-pong-pro" element={<PingPongProGame />} />
            <Route path="/game/pickleball-champion" element={<PickleballChampionGame />} />
            <Route path="/game/zombie-survival" element={<ZombieSurvival />} />
            <Route path="/game/tank-commander" element={<TankCommander />} />
            <Route path="/game/cyber-combat" element={<CyberCombat />} />
            <Route path="/game/shadow-ninja-fight" element={<ShadowNinjaFight />} />
            <Route path="/game/racing-thunder" element={<RacingThunderGame />} />
            
            {/* Info Pages Info */}
            <Route path="/developers" element={<Developers />} />
            <Route path="/affiliates" element={<Affiliates />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
