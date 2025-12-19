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
import MemoryGame from "./games/MemoryGame";
import TicTacToe from "./games/TicTacToe";
import ClickerGame from "./games/ClickerGame";
import BreakoutGame from "./games/BreakoutGame";
import Game2048 from "./games/Game2048";

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
            <Route path="/game/snake-game" element={<SnakeGame />} />
            <Route path="/game/memory" element={<MemoryGame />} />
            <Route path="/game/memory-match" element={<MemoryGame />} />
            <Route path="/game/tictactoe" element={<TicTacToe />} />
            <Route path="/game/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/game/clicker" element={<ClickerGame />} />
            <Route path="/game/click-quest" element={<ClickerGame />} />
            <Route path="/game/breakout" element={<BreakoutGame />} />
            <Route path="/game/2048" element={<Game2048 />} />
            
            {/* Info Pages */}
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
