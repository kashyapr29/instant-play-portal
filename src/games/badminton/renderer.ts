// Badminton Smash Renderer

import { Player, Shuttlecock, PowerUp, Particle, Court } from './types';
import { POWER_UP_CONFIGS } from './powerups';

export const renderCourt = (
  ctx: CanvasRenderingContext2D,
  court: Court,
  width: number,
  height: number
) => {
  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  court.bgColors.forEach((color, i) => {
    bgGradient.addColorStop(i / (court.bgColors.length - 1), color);
  });
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Stadium lights effect
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 6; i++) {
    const x = (i + 0.5) * (width / 6);
    ctx.beginPath();
    ctx.arc(x, -20, 80, 0, Math.PI * 2);
    ctx.fill();
  }

  // Court area
  const courtMargin = 30;
  const courtTop = 80;
  const courtBottom = height - 120;
  const courtWidth = width - courtMargin * 2;
  const courtHeight = courtBottom - courtTop;

  // Court shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(courtMargin + 5, courtTop + 5, courtWidth, courtHeight);

  // Court surface
  ctx.fillStyle = court.courtColor;
  ctx.fillRect(courtMargin, courtTop, courtWidth, courtHeight);

  // Court texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < courtWidth; i += 15) {
    ctx.beginPath();
    ctx.moveTo(courtMargin + i, courtTop);
    ctx.lineTo(courtMargin + i, courtBottom);
    ctx.stroke();
  }

  // Court lines
  ctx.strokeStyle = court.lineColor;
  ctx.lineWidth = 3;

  // Outer boundary
  ctx.strokeRect(courtMargin + 10, courtTop + 10, courtWidth - 20, courtHeight - 20);

  // Center line (net position)
  const centerY = courtTop + courtHeight / 2;
  ctx.beginPath();
  ctx.moveTo(courtMargin + 10, centerY);
  ctx.lineTo(width - courtMargin - 10, centerY);
  ctx.stroke();

  // Service lines
  ctx.setLineDash([8, 4]);
  const serviceLineOffset = courtHeight * 0.25;
  ctx.beginPath();
  ctx.moveTo(courtMargin + 10, courtTop + serviceLineOffset);
  ctx.lineTo(width - courtMargin - 10, courtTop + serviceLineOffset);
  ctx.moveTo(courtMargin + 10, courtBottom - serviceLineOffset);
  ctx.lineTo(width - courtMargin - 10, courtBottom - serviceLineOffset);
  ctx.stroke();
  ctx.setLineDash([]);

  // Net
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(courtMargin + 5, centerY - 2, courtWidth - 10, 4);

  // Net posts
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(courtMargin, centerY - 15, 8, 30);
  ctx.fillRect(width - courtMargin - 8, centerY - 15, 8, 30);
};

export const renderPlayer = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  isOpponent: boolean,
  isSwinging: boolean
) => {
  const { x, y, width: w, height: h } = player;
  const centerX = x + w / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h + 5, w / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGradient = ctx.createLinearGradient(x, y, x + w, y + h);
  if (isOpponent) {
    bodyGradient.addColorStop(0, '#DC2626');
    bodyGradient.addColorStop(1, '#991B1B');
  } else {
    bodyGradient.addColorStop(0, '#2563EB');
    bodyGradient.addColorStop(1, '#1D4ED8');
  }
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.roundRect(x + 5, y + 20, w - 10, h - 25, 8);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(centerX, y + 10, 14, 0, Math.PI * 2);
  ctx.fill();

  // Avatar
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.avatar, centerX, y + 10);

  // Racket
  ctx.save();
  ctx.translate(isOpponent ? x + 5 : x + w - 5, y + h / 2);
  
  const racketAngle = isSwinging ? (isOpponent ? 0.8 : -0.8) : (isOpponent ? 0.3 : -0.3);
  ctx.rotate(racketAngle);

  // Racket handle
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(-2, 0, 4, 22);

  // Racket head (oval shape for badminton)
  ctx.strokeStyle = '#4B5563';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -12, 10, 14, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Strings
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 0.5;
  for (let i = -8; i <= 8; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, -24);
    ctx.lineTo(i, 0);
    ctx.stroke();
  }
  for (let i = -20; i <= -4; i += 4) {
    ctx.beginPath();
    ctx.moveTo(-8, i);
    ctx.lineTo(8, i);
    ctx.stroke();
  }

  ctx.restore();
};

export const renderShuttlecock = (
  ctx: CanvasRenderingContext2D,
  shuttlecock: Shuttlecock
) => {
  if (!shuttlecock.visible) return;

  const { x, y, radius, isSmash } = shuttlecock;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y + 20, radius, radius / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smash trail
  if (isSmash) {
    ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(x - shuttlecock.vx * i * 2, y - shuttlecock.vy * i * 2, radius - i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Feathers (cone shape)
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  const featherLength = radius * 2.5;
  const angle = Math.atan2(shuttlecock.vy, shuttlecock.vx);
  ctx.moveTo(x + Math.cos(angle) * radius * 0.5, y + Math.sin(angle) * radius * 0.5);
  ctx.lineTo(
    x - Math.cos(angle - 0.5) * featherLength,
    y - Math.sin(angle - 0.5) * featherLength
  );
  ctx.lineTo(
    x - Math.cos(angle + 0.5) * featherLength,
    y - Math.sin(angle + 0.5) * featherLength
  );
  ctx.closePath();
  ctx.fill();

  // Cork (tip)
  const corkGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  corkGradient.addColorStop(0, '#FFFFFF');
  corkGradient.addColorStop(0.7, '#F5DEB3');
  corkGradient.addColorStop(1, '#DEB887');
  ctx.fillStyle = corkGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Cork highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
};

export const renderPowerUp = (
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  time: number
) => {
  if (!powerUp.active || powerUp.collected) return;

  const config = POWER_UP_CONFIGS[powerUp.type];
  const pulse = Math.sin(time * 0.005) * 3;
  const radius = 18 + pulse;

  // Glow
  const glow = ctx.createRadialGradient(powerUp.x, powerUp.y, 0, powerUp.x, powerUp.y, radius * 2);
  glow.addColorStop(0, config.color + '60');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, radius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Circle
  ctx.fillStyle = config.color;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Icon
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(config.icon, powerUp.x, powerUp.y);
};

export const renderParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
) => {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    
    if (p.type === 'feather') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vx * 0.5);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else if (p.type === 'confetti') {
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  });
};

export const renderHitIndicator = (
  ctx: CanvasRenderingContext2D,
  quality: 'perfect' | 'good' | 'early' | 'late' | 'miss' | null,
  alpha: number,
  x: number,
  y: number
) => {
  if (!quality || alpha <= 0) return;

  ctx.globalAlpha = alpha;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const colors: Record<string, string> = {
    perfect: '#FFD700',
    good: '#22C55E',
    early: '#F97316',
    late: '#F97316',
    miss: '#EF4444',
  };

  const texts: Record<string, string> = {
    perfect: 'PERFECT!',
    good: 'Good!',
    early: 'Early',
    late: 'Late',
    miss: 'Miss',
  };

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(texts[quality], x + 2, y + 2);

  // Text
  ctx.fillStyle = colors[quality];
  ctx.fillText(texts[quality], x, y);

  ctx.globalAlpha = 1;
};

export const renderScore = (
  ctx: CanvasRenderingContext2D,
  playerScore: [number, number],
  opponentScore: [number, number],
  serving: 'player' | 'opponent',
  width: number
) => {
  // Score background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 90, 10, 180, 55, 12);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Games score
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${playerScore[0]} - ${opponentScore[0]}`, width / 2, 32);

  // Points
  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(`Points: ${playerScore[1]} - ${opponentScore[1]}`, width / 2, 52);

  // Serve indicator
  ctx.font = '10px Arial';
  ctx.fillStyle = serving === 'player' ? '#22C55E' : '#EF4444';
  ctx.fillText(serving === 'player' ? '● Your Serve' : '● Opponent Serve', width / 2, 70);
};

export const renderTimingBar = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number
) => {
  const barWidth = 200;
  const barHeight = 12;
  const x = (width - barWidth) / 2;
  const y = height - 50;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, barWidth + 10, barHeight + 10, 8);
  ctx.fill();

  // Timing zones
  const earlyWidth = barWidth * 0.3;
  const perfectWidth = barWidth * 0.4;
  const lateWidth = barWidth * 0.3;

  ctx.fillStyle = '#F97316';
  ctx.fillRect(x, y, earlyWidth, barHeight);

  ctx.fillStyle = '#22C55E';
  ctx.fillRect(x + earlyWidth, y, perfectWidth, barHeight);

  ctx.fillStyle = '#F97316';
  ctx.fillRect(x + earlyWidth + perfectWidth, y, lateWidth, barHeight);

  // Indicator
  const indicatorX = x + progress * barWidth;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(indicatorX, y - 5);
  ctx.lineTo(indicatorX + 6, y + barHeight / 2);
  ctx.lineTo(indicatorX, y + barHeight + 5);
  ctx.lineTo(indicatorX - 6, y + barHeight / 2);
  ctx.closePath();
  ctx.fill();
};
