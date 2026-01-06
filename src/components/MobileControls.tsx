import { useEffect, useRef, useState, useCallback } from 'react';
import { Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onMove: (dx: number, dy: number) => void;
  onFire: (firing: boolean) => void;
  onAim?: (angle: number) => void;
  disabled?: boolean;
}

export const MobileControls = ({ onMove, onFire, onAim, disabled }: MobileControlsProps) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [firing, setFiring] = useState(false);
  const centerRef = useRef({ x: 0, y: 0 });
  const moveIntervalRef = useRef<number>();

  const handleJoystickStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setJoystickActive(true);
  }, [disabled]);

  const handleJoystickMove = useCallback((clientX: number, clientY: number) => {
    if (!joystickActive || disabled) return;
    
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.min(Math.hypot(dx, dy), 40);
    const angle = Math.atan2(dy, dx);
    
    setJoystickPos({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
    });

    const normalizedX = dist > 5 ? Math.cos(angle) : 0;
    const normalizedY = dist > 5 ? Math.sin(angle) : 0;
    onMove(normalizedX, normalizedY);
  }, [joystickActive, disabled, onMove]);

  const handleJoystickEnd = useCallback(() => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  }, [onMove]);

  const handleFireStart = useCallback(() => {
    if (disabled) return;
    setFiring(true);
    onFire(true);
  }, [disabled, onFire]);

  const handleFireEnd = useCallback(() => {
    setFiring(false);
    onFire(false);
  }, [onFire]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      Array.from(e.touches).forEach(touch => {
        if (touch.target === joystickRef.current || joystickRef.current?.contains(touch.target as Node)) {
          handleJoystickMove(touch.clientX, touch.clientY);
        }
      });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const joystickTouches = Array.from(e.touches).filter(touch => 
        touch.target === joystickRef.current || joystickRef.current?.contains(touch.target as Node)
      );
      if (joystickTouches.length === 0 && joystickActive) {
        handleJoystickEnd();
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [joystickActive, handleJoystickMove, handleJoystickEnd]);

  // Detect if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-48 pointer-events-none z-50 touch-none">
      {/* Joystick */}
      <div
        ref={joystickRef}
        className="absolute left-8 bottom-8 w-32 h-32 rounded-full bg-white/10 border-2 border-white/30 pointer-events-auto touch-none"
        onTouchStart={(e) => {
          e.preventDefault();
          const touch = e.touches[0];
          handleJoystickStart(touch.clientX, touch.clientY);
        }}
      >
        <div
          className={`absolute w-16 h-16 rounded-full bg-white/40 border-2 border-white/60 transition-transform ${
            joystickActive ? 'scale-110' : ''
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
          }}
        />
      </div>

      {/* Fire button */}
      <div
        className={`absolute right-8 bottom-8 w-24 h-24 rounded-full flex items-center justify-center pointer-events-auto touch-none transition-all ${
          firing 
            ? 'bg-red-500/80 border-4 border-red-300 scale-95' 
            : 'bg-red-500/50 border-4 border-red-400/50'
        }`}
        onTouchStart={(e) => {
          e.preventDefault();
          handleFireStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleFireEnd();
        }}
      >
        <Crosshair className={`w-10 h-10 ${firing ? 'text-white' : 'text-white/80'}`} />
      </div>

      {/* Labels */}
      <div className="absolute left-8 bottom-44 text-white/40 text-xs font-bold uppercase">Move</div>
      <div className="absolute right-12 bottom-36 text-white/40 text-xs font-bold uppercase">Fire</div>
    </div>
  );
};
