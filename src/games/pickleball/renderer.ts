// Pickleball Champion Renderer
import { Player, Ball, Court, PowerUp, Particle } from './types';

export function renderCourt(
  ctx: CanvasRenderingContext2D,
  court: Court,
  width: number,
  height: number
): void {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  court.bgColors.forEach((color, i) => {
    gradient.addColorStop(i / (court.bgColors.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Court surface
  const courtMargin = 40;
  const courtWidth = width - courtMargin * 2;
  const courtHeight = height - courtMargin * 2;

  ctx.fillStyle = court.courtColor;
  ctx.fillRect(courtMargin, courtMargin, courtWidth, courtHeight);

  // Court lines
  ctx.strokeStyle = court.lineColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(courtMargin, courtMargin, courtWidth, courtHeight);

  // Center line (net)
  ctx.beginPath();
  ctx.moveTo(width / 2, courtMargin);
  ctx.lineTo(width / 2, height - courtMargin);
  ctx.stroke();

  // Net
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(width / 2 - 3, courtMargin, 6, courtHeight);

  // Net pattern
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  for (let y = courtMargin; y < height - courtMargin; y += 15) {
    ctx.beginPath();
    ctx.moveTo(width / 2 - 3, y);
    ctx.lineTo(width / 2 + 3, y);
    ctx.stroke();
  }

  // Non-volley zone (kitchen) lines
  const kitchenWidth = courtWidth * 0.15;
  ctx.strokeStyle = court.lineColor;
  ctx.lineWidth = 2;
  
  // Left kitchen
  ctx.beginPath();
  ctx.moveTo(courtMargin + kitchenWidth, courtMargin);
  ctx.lineTo(courtMargin + kitchenWidth, height - courtMargin);
  ctx.stroke();
  
  // Right kitchen
  ctx.beginPath();
  ctx.moveTo(width - courtMargin - kitchenWidth, courtMargin);
  ctx.lineTo(width - courtMargin - kitchenWidth, height - courtMargin);
  ctx.stroke();

  // Kitchen labels
  ctx.fillStyle = court.lineColor + '40';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('KITCHEN', courtMargin + kitchenWidth / 2, height / 2);
  ctx.fillText('KITCHEN', width - courtMargin - kitchenWidth / 2, height / 2);

  // Service boxes
  const serviceLineY = height / 2;
  ctx.beginPath();
  ctx.moveTo(courtMargin, serviceLineY);
  ctx.lineTo(courtMargin + kitchenWidth, serviceLineY);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(width - courtMargin, serviceLineY);
  ctx.lineTo(width - courtMargin - kitchenWidth, serviceLineY);
  ctx.stroke();
}

export function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  isPlayer: boolean
): void {
  const { x, y, width, height } = player;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 5, width / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGradient = ctx.createLinearGradient(x, y, x, y + height);
  if (isPlayer) {
    bodyGradient.addColorStop(0, '#10b981');
    bodyGradient.addColorStop(1, '#059669');
  } else {
    bodyGradient.addColorStop(0, '#f59e0b');
    bodyGradient.addColorStop(1, '#d97706');
  }
  ctx.fillStyle = bodyGradient;
  ctx.fillRect(x, y + height * 0.3, width, height * 0.7);

  // Head
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height * 0.2, width * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = '#fcd5b8';
  ctx.fill();

  // Paddle
  const paddleLength = 35;
  const paddleWidth = 25;
  const paddleX = isPlayer ? x + width + 5 : x - paddleWidth - 5;
  const paddleY = y + height * 0.4;

  // Paddle handle
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(
    isPlayer ? paddleX - 3 : paddleX + paddleWidth,
    paddleY + paddleLength / 2 - 3,
    12,
    6
  );

  // Paddle face (composite material look)
  const paddleGradient = ctx.createLinearGradient(paddleX, paddleY, paddleX + paddleWidth, paddleY);
  paddleGradient.addColorStop(0, '#1e40af');
  paddleGradient.addColorStop(0.5, '#3b82f6');
  paddleGradient.addColorStop(1, '#1e40af');
  ctx.fillStyle = paddleGradient;
  ctx.beginPath();
  ctx.roundRect(paddleX, paddleY, paddleWidth, paddleLength, 4);
  ctx.fill();

  // Paddle edge
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function renderBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball
): void {
  if (!ball.visible) return;

  const { x, y, radius } = ball;

  // Trajectory preview
  if (ball.trajectory.length > 1) {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ball.trajectory[0].x, ball.trajectory[0].y);
    ball.trajectory.forEach(point => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ball shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + radius + 10, radius, radius / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball (polymer with holes pattern)
  const ballGradient = ctx.createRadialGradient(
    x - radius / 3, y - radius / 3, 0,
    x, y, radius
  );
  ballGradient.addColorStop(0, '#fef08a');
  ballGradient.addColorStop(0.7, '#facc15');
  ballGradient.addColorStop(1, '#ca8a04');
  
  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Holes pattern (characteristic of pickleball)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  const holeRadius = radius / 6;
  const holePositions = [
    { x: 0, y: -radius / 2 },
    { x: radius / 2, y: 0 },
    { x: 0, y: radius / 2 },
    { x: -radius / 2, y: 0 },
    { x: radius / 3, y: -radius / 3 },
    { x: -radius / 3, y: radius / 3 },
  ];
  holePositions.forEach(pos => {
    ctx.beginPath();
    ctx.arc(x + pos.x, y + pos.y, holeRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(x - radius / 3, y - radius / 3, radius / 4, 0, Math.PI * 2);
  ctx.fill();
}

export function renderPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp
): void {
  if (!powerUp.active || powerUp.collected) return;

  const { x, y, type } = powerUp;
  const size = 25;
  const pulse = Math.sin(Date.now() / 200) * 3;

  // Glow effect
  ctx.shadowColor = getTypeColor(type);
  ctx.shadowBlur = 15 + pulse;

  // Background circle
  ctx.fillStyle = getTypeColor(type);
  ctx.beginPath();
  ctx.arc(x, y, size + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Inner circle
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Icon
  ctx.fillStyle = getTypeColor(type);
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getTypeIcon(type), x, y);

  ctx.shadowBlur = 0;
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    slow_motion: '#3b82f6',
    power_shot: '#ef4444',
    auto_aim: '#a855f7',
    speed_boost: '#22c55e',
    perfect_dink: '#f59e0b',
  };
  return colors[type] || '#ffffff';
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    slow_motion: '⏱',
    power_shot: '💥',
    auto_aim: '🎯',
    speed_boost: '⚡',
    perfect_dink: '🏓',
  };
  return icons[type] || '?';
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
): void {
  particles.forEach(particle => {
    const alpha = particle.life / particle.maxLife;
    ctx.globalAlpha = alpha;

    if (particle.type === 'confetti') {
      ctx.fillStyle = particle.color;
      ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size * 2
      );
    } else if (particle.type === 'spark') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Bounce effect
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  });
}

export function renderHitIndicator(
  ctx: CanvasRenderingContext2D,
  quality: string | null,
  x: number,
  y: number
): void {
  if (!quality) return;

  const colors: Record<string, string> = {
    perfect: '#22c55e',
    good: '#3b82f6',
    early: '#f59e0b',
    late: '#f59e0b',
    miss: '#ef4444',
  };

  const labels: Record<string, string> = {
    perfect: 'PERFECT DINK!',
    good: 'GOOD!',
    early: 'EARLY',
    late: 'LATE',
    miss: 'MISS',
  };

  ctx.fillStyle = colors[quality] || '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Text shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(labels[quality] || quality, x, y);
  ctx.shadowBlur = 0;
}

export function renderScore(
  ctx: CanvasRenderingContext2D,
  playerScore: [number, number],
  opponentScore: [number, number],
  serving: 'player' | 'opponent',
  width: number
): void {
  const y = 25;

  // Score background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 100, 5, 200, 40, 8);
  ctx.fill();

  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Player score
  ctx.fillStyle = '#10b981';
  ctx.fillText(`${playerScore[0]}`, width / 2 - 50, y);

  // Separator
  ctx.fillStyle = '#ffffff';
  ctx.fillText('-', width / 2, y);

  // Opponent score
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`${opponentScore[0]}`, width / 2 + 50, y);

  // Serving indicator
  ctx.fillStyle = '#facc15';
  ctx.font = '12px Arial';
  const servingX = serving === 'player' ? width / 2 - 50 : width / 2 + 50;
  ctx.fillText('●', servingX, y + 18);
}

export function renderTimingBar(
  ctx: CanvasRenderingContext2D,
  hitWindow: { start: number; end: number } | null,
  width: number,
  height: number
): void {
  if (!hitWindow) return;

  const now = Date.now();
  const progress = (now - hitWindow.start) / (hitWindow.end - hitWindow.start);
  
  if (progress < 0 || progress > 1) return;

  const barWidth = 150;
  const barHeight = 12;
  const barX = width / 2 - barWidth / 2;
  const barY = height - 60;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10, 6);
  ctx.fill();

  // Bar track
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barWidth, barHeight, 4);
  ctx.fill();

  // Perfect zone (center)
  const perfectStart = barWidth * 0.4;
  const perfectWidth = barWidth * 0.2;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(barX + perfectStart, barY, perfectWidth, barHeight);

  // Progress indicator
  const indicatorX = barX + progress * barWidth;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(indicatorX, barY + barHeight / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TAP TO DINK!', width / 2, barY - 12);
}
