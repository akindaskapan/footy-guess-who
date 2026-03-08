import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import GameScreen from "./pages/GameScreen";
import CampaignScreen from "./pages/CampaignScreen";
import TimeAttackScreen from "./pages/TimeAttackScreen";
import MysteryScreen from "./pages/MysteryScreen";
import Stats from "./pages/Stats";
import Leaderboard from "./pages/Leaderboard";
import AuthPage from "./pages/AuthPage";
import Store from "./pages/Store";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/play/timeattack" element={<TimeAttackScreen />} />
        <Route path="/play/mystery" element={<MysteryScreen />} />
        <Route path="/play/:mode" element={<GameScreen />} />
        <Route path="/campaign" element={<CampaignScreen />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/store" element={<Store />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
