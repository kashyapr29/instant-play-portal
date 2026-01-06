import { useState } from 'react';
import { Trophy, Check, Gift, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ACHIEVEMENTS, getAchievementProgress, claimAchievementReward, loadAchievementData } from '@/lib/achievements';

interface AchievementsProps {
  onClaimReward?: (amount: number) => void;
  theme?: 'zombie' | 'tank' | 'cyber';
}

export const Achievements = ({ onClaimReward, theme = 'zombie' }: AchievementsProps) => {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(getAchievementProgress());

  const themeStyles = {
    zombie: {
      bg: 'bg-gradient-to-b from-zombie-bg to-zombie-dark',
      border: 'border-zombie-blood/50',
      accent: 'text-zombie-blood',
      button: 'bg-zombie-blood hover:bg-zombie-blood/80',
      glow: 'shadow-[0_0_20px_rgba(139,0,0,0.4)]',
    },
    tank: {
      bg: 'bg-gradient-to-b from-tank-olive to-tank-dark',
      border: 'border-tank-gold/50',
      accent: 'text-tank-gold',
      button: 'bg-tank-gold hover:bg-tank-gold/80',
      glow: 'shadow-[0_0_20px_rgba(218,165,32,0.4)]',
    },
    cyber: {
      bg: 'bg-gradient-to-b from-cyber-bg to-cyber-dark',
      border: 'border-cyber-cyan/50',
      accent: 'text-cyber-cyan',
      button: 'bg-cyber-cyan hover:bg-cyber-cyan/80',
      glow: 'shadow-[0_0_20px_rgba(0,255,255,0.4)]',
    },
  };

  const style = themeStyles[theme];

  const handleClaim = (achievementId: string) => {
    const reward = claimAchievementReward(achievementId);
    if (reward > 0) {
      onClaimReward?.(reward);
      setProgress(getAchievementProgress());
    }
  };

  const refreshProgress = () => {
    setProgress(getAchievementProgress());
  };

  const data = loadAchievementData();

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) refreshProgress(); }}>
      <DialogTrigger asChild>
        <button className={`w-full px-6 py-3 ${style.button} text-white rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 relative`}>
          <Trophy className="w-5 h-5" />
          ACHIEVEMENTS
          {progress.unclaimedCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {progress.unclaimedCount}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className={`max-w-lg ${style.bg} ${style.border} border-2 ${style.glow}`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-game-title flex items-center gap-2 ${style.accent}`}>
            <Trophy className="w-6 h-6" />
            Achievements ({progress.unlockedCount}/{progress.total})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {ACHIEVEMENTS.map(achievement => {
              const unlocked = data.unlocked.find(u => u.id === achievement.id);
              const isUnlocked = !!unlocked;
              const isClaimed = unlocked?.claimed ?? false;

              return (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isUnlocked 
                      ? isClaimed 
                        ? 'bg-white/5 border-white/20' 
                        : `bg-gradient-to-r from-green-500/20 to-transparent border-green-500/50 ${style.glow}`
                      : 'bg-black/30 border-white/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-3xl ${!isUnlocked && 'grayscale opacity-50'}`}>
                      {isUnlocked ? achievement.icon : <Lock className="w-8 h-8 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                          {achievement.name}
                        </h4>
                        {isClaimed && <Check className="w-4 h-4 text-green-400" />}
                      </div>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-game-gold font-bold">+{achievement.reward} credits</span>
                      </div>
                    </div>
                    {isUnlocked && !isClaimed && (
                      <button
                        onClick={() => handleClaim(achievement.id)}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-all flex items-center gap-1"
                      >
                        <Gift className="w-4 h-4" />
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
