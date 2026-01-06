import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingBag, Star, Zap, Heart, Shield, Gauge, Target, Package } from 'lucide-react';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: 'damage' | 'health' | 'speed' | 'armor' | 'ammo' | 'shield' | 'energy';
  level: number;
  maxLevel: number;
  basePrice: number;
  priceMultiplier: number;
}

interface UpgradeShopProps {
  credits: number;
  upgrades: Upgrade[];
  onPurchase: (upgradeId: string) => void;
  accentColor?: string;
  theme?: 'zombie' | 'tank' | 'cyber';
}

const ICONS = {
  damage: Target,
  health: Heart,
  speed: Gauge,
  armor: Shield,
  ammo: Package,
  shield: Shield,
  energy: Zap,
};

const THEME_COLORS = {
  zombie: {
    accent: 'bg-red-600 hover:bg-red-700',
    glow: 'shadow-[0_0_20px_rgba(220,38,38,0.5)]',
    border: 'border-red-500/30',
    text: 'text-red-400',
    bg: 'bg-gradient-to-br from-red-950/95 to-gray-900/95',
  },
  tank: {
    accent: 'bg-green-600 hover:bg-green-700',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]',
    border: 'border-green-500/30',
    text: 'text-green-400',
    bg: 'bg-gradient-to-br from-green-950/95 to-gray-900/95',
  },
  cyber: {
    accent: 'bg-cyan-600 hover:bg-cyan-700',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.5)]',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    bg: 'bg-gradient-to-br from-cyan-950/95 to-gray-900/95',
  },
};

export const UpgradeShop = ({ credits, upgrades, onPurchase, theme = 'cyber' }: UpgradeShopProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = THEME_COLORS[theme];

  const getUpgradePrice = (upgrade: Upgrade) => {
    return Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, upgrade.level - 1));
  };

  const canAfford = (upgrade: Upgrade) => {
    return credits >= getUpgradePrice(upgrade) && upgrade.level < upgrade.maxLevel;
  };

  const handlePurchase = (upgrade: Upgrade) => {
    if (canAfford(upgrade)) {
      onPurchase(upgrade.id);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={`flex items-center gap-2 px-4 py-2 ${colors.accent} text-white rounded-lg font-bold transition-all hover:scale-105 ${colors.glow}`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>UPGRADES</span>
        </button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className={`w-[400px] sm:w-[500px] ${colors.bg} ${colors.border} border-l-2 backdrop-blur-xl`}
      >
        <SheetHeader>
          <SheetTitle className="text-2xl font-black text-white flex items-center gap-3">
            <ShoppingBag className={`w-7 h-7 ${colors.text}`} />
            UPGRADE SHOP
          </SheetTitle>
          <div className={`flex items-center gap-2 text-xl font-bold ${colors.text}`}>
            <Star className="w-5 h-5 fill-current" />
            <span>{credits.toLocaleString()}</span>
            <span className="text-sm text-gray-400">CREDITS</span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {upgrades.map((upgrade) => {
            const Icon = ICONS[upgrade.icon];
            const price = getUpgradePrice(upgrade);
            const isMaxed = upgrade.level >= upgrade.maxLevel;
            const affordable = canAfford(upgrade);

            return (
              <div
                key={upgrade.id}
                className={`p-4 rounded-xl border ${colors.border} bg-black/40 backdrop-blur transition-all hover:bg-black/60`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isMaxed ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
                      <Icon className={`w-6 h-6 ${isMaxed ? 'text-yellow-400' : colors.text}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{upgrade.name}</h3>
                      <p className="text-gray-400 text-sm">{upgrade.description}</p>
                    </div>
                  </div>
                </div>

                {/* Level progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Level {upgrade.level}</span>
                    <span>Max: {upgrade.maxLevel}</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${isMaxed ? 'bg-yellow-500' : colors.accent.replace('hover:', '')}`}
                      style={{ width: `${(upgrade.level / upgrade.maxLevel) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Purchase button */}
                {isMaxed ? (
                  <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold">
                    <Star className="w-4 h-4 fill-current" />
                    MAXED OUT
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(upgrade)}
                    disabled={!affordable}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold transition-all ${
                      affordable
                        ? `${colors.accent} text-white hover:scale-[1.02]`
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span>{price.toLocaleString()} CREDITS</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-4 left-4 right-4 text-center text-gray-500 text-sm">
          Earn credits by defeating enemies!
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UpgradeShop;
