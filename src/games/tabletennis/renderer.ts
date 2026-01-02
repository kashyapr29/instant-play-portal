// Table Tennis Renderer

import { Player, Ball, PowerUp, Particle, Table } from './types';
import { POWER_UP_CONFIGS } from './powerups';

export const renderTable = (
  ctx: CanvasRenderingContext2D,
  table: Table,
  width: number,
  height: number
) => {
  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  table.bgColors.forEach((color, i) => {
    bgGradient.addColorStop(i / (table.bgColors.length - 1), color);
  });
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Arena lights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 4; i++) {
    const x = (i + 0.5) * (width / 4);
    ctx.beginPath();
    ctx.arc(x, -30, 100, 0, Math.PI * 2);
    ctx.fill();
  }

  // Table area (top-down perspective)
  const tableMargin = 40;
  const tableTop = 100;
  const tableBottom = height - 140;
  const tableWidth = width - tableMargin * 2;
  const tableHeight = tableBottom - tableTop;

  // Table shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(tableMargin + 6, tableTop + 6, tableWidth, tableHeight);

  // Table surface
  ctx.fillStyle = table.tableColor;
  ctx.fillRect(tableMargin, tableTop, tableWidth, tableHeight);

  // Table border/edge
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(tableMargin, tableTop, tableWidth, tableHeight);

  // White lines
  ctx.strokeStyle = table.lineColor;
  ctx.lineWidth = 2;

  // Outer line
  ctx.strokeRect(tableMargin + 8, tableTop + 8, tableWidth - 16, tableHeight - 16);

  // Center line (net position)
  const centerY = tableTop + tableHeight / 2;
  ctx.beginPath();
  ctx.moveTo(tableMargin + 8, centerY);
  ctx.lineTo(width - tableMargin - 8, centerY);
  ctx.stroke();

  // Middle line (for doubles, but looks nice)
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(width / 2, tableTop + 8);
  ctx.lineTo(width / 2, centerY - 5);
  ctx.moveTo(width / 2, centerY + 5);
  ctx.lineTo(width / 2, tableBottom - 8);
  ctx.stroke();
  ctx.setLineDash([]);

  // Net
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(tableMargin - 5, centerY - 2, tableWidth + 10, 4);

  // Net posts
  ctx.fillStyle = '#4B5563';
  ctx.fillRect(tableMargin - 10, centerY - 12, 10, 24);
  ctx.fillRect(width - tableMargin, centerY - 12, 10, 24);
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, y + h + 3, w / 2, 6, 0, 0, Math.PI * 2);
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
  ctx.roundRect(x + 8, y + 18, w - 16, h - 22, 6);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(centerX, y + 10, 12, 0, Math.PI * 2);
  ctx.fill();

  // Avatar
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(player.avatar, centerX, y + 10);

  // Paddle (distinctive ping pong paddle shape)
  ctx.save();
  ctx.translate(isOpponent ? x + 8 : x + w - 8, y + h / 2);
  
  const paddleAngle = isSwinging ? (isOpponent ? 0.6 : -0.6) : (isOpponent ? 0.2 : -0.2);
  ctx.rotate(paddleAngle);

  // Handle
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(-3, 0, 6, 18);

  // Paddle head (round)
  ctx.fillStyle = isOpponent ? '#EF4444' : '#3B82F6';
  ctx.beginPath();
  ctx.arc(0, -10, 14, 0, Math.PI * 2);
  ctx.fill();

  // Rubber texture
  ctx.fillStyle = isOpponent ? '#B91C1C' : '#1D4ED8';
  ctx.beginPath();
  ctx.arc(0, -10, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const renderBall = (
  ctx: CanvasRenderingContext2D,
  ball: Ball
) => {
  if (!ball.visible) return;

  const { x, y, radius } = ball;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 15, radius, radius / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball (orange ping pong ball)
  const ballGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, radius);
  ballGradient.addColorStop(0, '#FFEDD5');
  ballGradient.addColorStop(0.5, '#FB923C');
  ballGradient.addColorStop(1, '#EA580C');
  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Spin indicator
  if (Math.abs(ball.spin) > 0.3) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, ball.spin > 0 ? 0 : Math.PI, ball.spin > 0 ? Math.PI : Math.PI * 2);
    ctx.stroke();
  }
};

export const renderPowerUp = (
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  time: number
) => {
  if (!powerUp.active || powerUp.collected) return;

  const config = POWER_UP_CONFIGS[powerUp.type];
  const pulse = Math.sin(time * 0.005) * 3;
  const radius = 16 + pulse;

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
  ctx.font = 'bold 14px Arial';
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
    
    if (p.type === 'confetti') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.vx * 0.3);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
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
  ctx.font = 'bold 26px Arial';
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

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(texts[quality], x + 2, y + 2);
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 85, 10, 170, 50, 10);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Games score (first to 11, win by 2)
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${playerScore[1]} - ${opponentScore[1]}`, width / 2, 32);

  // Sets
  ctx.font = '12px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`Games: ${playerScore[0]} - ${opponentScore[0]}`, width / 2, 50);

  // Serve indicator
  ctx.font = '9px Arial';
  ctx.fillStyle = serving === 'player' ? '#22C55E' : '#EF4444';
  ctx.fillText(serving === 'player' ? '● Your Serve' : '● Opponent', width / 2, 65);
};

export const renderTimingBar = (
  ctx: CanvasRenderingContext2D,
  progress: number,
  width: number,
  height: number
) => {
  const barWidth = 180;
  const barHeight = 10;
  const x = (width - barWidth) / 2;
  const y = height - 45;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 4, barWidth + 8, barHeight + 8, 6);
  ctx.fill();

  // Timing zones
  ctx.fillStyle = '#F97316';
  ctx.fillRect(x, y, barWidth * 0.3, barHeight);

  ctx.fillStyle = '#22C55E';
  ctx.fillRect(x + barWidth * 0.3, y, barWidth * 0.4, barHeight);

  ctx.fillStyle = '#F97316';
  ctx.fillRect(x + barWidth * 0.7, y, barWidth * 0.3, barHeight);

  // Indicator
  const indicatorX = x + progress * barWidth;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(indicatorX, y - 4);
  ctx.lineTo(indicatorX + 5, y + barHeight / 2);
  ctx.lineTo(indicatorX, y + barHeight + 4);
  ctx.lineTo(indicatorX - 5, y + barHeight / 2);
  ctx.closePath();
  ctx.fill();
};
