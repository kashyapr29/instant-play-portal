import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Achievement } from '@/lib/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementToast = ({ achievement, onClose }: AchievementToastProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-gradient-to-r from-game-gold/20 to-yellow-500/10 border-2 border-game-gold/50 rounded-xl p-4 shadow-[0_0_30px_rgba(255,215,0,0.4)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-game-gold/20 flex items-center justify-center animate-pulse">
            <Trophy className="w-6 h-6 text-game-gold" />
          </div>
          <div>
            <p className="text-xs text-game-gold/80 font-bold uppercase tracking-wider">Achievement Unlocked!</p>
            <p className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-2xl">{achievement.icon}</span>
              {achievement.name}
            </p>
            <p className="text-sm text-gray-300">{achievement.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
