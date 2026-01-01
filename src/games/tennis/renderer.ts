// Tennis Hero Canvas Renderer

import { Court, Player, Ball, PowerUp, Particle } from './types';
import { POWER_UP_CONFIGS } from './powerups';

export const renderCourt = (
  ctx: CanvasRenderingContext2D,
  court: Court,
  width: number,
  height: number
) => {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  court.bgColors.forEach((color, i) => {
    gradient.addColorStop(i / (court.bgColors.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Stadium elements (simplified)
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(0, i * 15, width, 8);
  }

  // Court area
  const courtPadding = 40;
  const courtX = courtPadding;
  const courtY = height * 0.15;
  const courtWidth = width - courtPadding * 2;
  const courtHeight = height * 0.7;

  // Court surface
  ctx.fillStyle = court.courtColor;
  ctx.fillRect(courtX, courtY, courtWidth, courtHeight);

  // Court shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(courtX + 5, courtY + courtHeight, courtWidth, 10);

  // Court lines
  ctx.strokeStyle = court.lineColor;
  ctx.lineWidth = 3;

  // Outer boundary
  ctx.strokeRect(courtX, courtY, courtWidth, courtHeight);

  // Net (center line)
  const netY = courtY + courtHeight / 2;
  ctx.beginPath();
  ctx.setLineDash([10, 5]);
  ctx.moveTo(courtX, netY);
  ctx.lineTo(courtX + courtWidth, netY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Net posts
  ctx.fillStyle = '#888';
  ctx.fillRect(courtX - 5, netY - 15, 10, 30);
  ctx.fillRect(courtX + courtWidth - 5, netY - 15, 10, 30);

  // Service lines
  const serviceLineOffset = courtHeight * 0.25;
  ctx.beginPath();
  ctx.moveTo(courtX, courtY + serviceLineOffset);
  ctx.lineTo(courtX + courtWidth, courtY + serviceLineOffset);
  ctx.moveTo(courtX, courtY + courtHeight - serviceLineOffset);
  ctx.lineTo(courtX + courtWidth, courtY + courtHeight - serviceLineOffset);
  ctx.stroke();

  // Center service line
  ctx.beginPath();
  ctx.moveTo(courtX + courtWidth / 2, courtY + serviceLineOffset);
  ctx.lineTo(courtX + courtWidth / 2, netY);
  ctx.moveTo(courtX + courtWidth / 2, netY);
  ctx.lineTo(courtX + courtWidth / 2, courtY + courtHeight - serviceLineOffset);
  ctx.stroke();

  // Doubles sidelines
  const doublesOffset = courtWidth * 0.1;
  ctx.beginPath();
  ctx.moveTo(courtX + doublesOffset, courtY);
  ctx.lineTo(courtX + doublesOffset, courtY + courtHeight);
  ctx.moveTo(courtX + courtWidth - doublesOffset, courtY);
  ctx.lineTo(courtX + courtWidth - doublesOffset, courtY + courtHeight);
  ctx.stroke();
};

export const renderPlayer = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  isOpponent: boolean,
  avatar: string,
  isSwinging: boolean = false
) => {
  const { x, y, width, height } = player;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + height + 5, width / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player body
  const bodyGradient = ctx.createLinearGradient(x, y, x, y + height);
  if (isOpponent) {
    bodyGradient.addColorStop(0, '#e74c3c');
    bodyGradient.addColorStop(1, '#c0392b');
  } else {
    bodyGradient.addColorStop(0, '#3498db');
    bodyGradient.addColorStop(1, '#2980b9');
  }
  
  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.roundRect(x, y + height * 0.3, width, height * 0.7, 5);
  ctx.fill();

  // Head
  ctx.fillStyle = '#FDBF6F';
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height * 0.2, width * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Avatar/face
  ctx.font = `${width * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(avatar, x + width / 2, y + height * 0.2);

  // Racket
  const racketX = isSwinging ? x + width + 10 : x + width + 5;
  const racketY = y + height * 0.4;
  
  // Racket handle
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(racketX - 2, racketY + 15, 4, 20);
  
  // Racket head
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.ellipse(racketX, racketY, 12, 18, isSwinging ? -0.3 : 0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Racket strings
  ctx.strokeStyle = '#bdc3c7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -8; i <= 8; i += 4) {
    ctx.moveTo(racketX + i, racketY - 15);
    ctx.lineTo(racketX + i, racketY + 15);
    ctx.moveTo(racketX - 10, racketY + i);
    ctx.lineTo(racketX + 10, racketY + i);
  }
  ctx.stroke();
};

export const renderBall = (
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  time: number
) => {
  if (!ball.visible) return;

  const { x, y, radius } = ball;

  // Ball shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + radius + 3, radius * 0.8, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball gradient
  const ballGradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  );
  ballGradient.addColorStop(0, '#c8ff00');
  ballGradient.addColorStop(0.5, '#9acd32');
  ballGradient.addColorStop(1, '#6b8e23');

  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Ball seam
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.7, time * 0.01, time * 0.01 + Math.PI);
  ctx.stroke();

  // Spin effect
  if (Math.abs(ball.spin) > 0.1) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
};

export const renderTrajectory = (
  ctx: CanvasRenderingContext2D,
  trajectory: { x: number; y: number }[],
  color: string = 'rgba(255,255,255,0.3)'
) => {
  if (trajectory.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.moveTo(trajectory[0].x, trajectory[0].y);
  trajectory.forEach(point => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
};

export const renderPowerUp = (
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  time: number
) => {
  if (!powerUp.active || powerUp.collected) return;

  const config = POWER_UP_CONFIGS[powerUp.type];
  const { x, y } = powerUp;
  const size = 30;
  const pulse = Math.sin(time * 0.005) * 5;

  // Glow effect
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size + pulse + 10);
  gradient.addColorStop(0, config.color);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, size + pulse + 10, 0, Math.PI * 2);
  ctx.fill();

  // Power-up circle
  ctx.fillStyle = config.color;
  ctx.beginPath();
  ctx.arc(x, y, size + pulse, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Icon
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText(config.icon, x, y);
};

export const renderParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
) => {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
    
    if (p.type === 'confetti') {
      ctx.fillRect(p.x, p.y, p.size, p.size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
  });
};

export const renderHitIndicator = (
  ctx: CanvasRenderingContext2D,
  quality: 'perfect' | 'good' | 'early' | 'late' | 'miss' | null,
  x: number,
  y: number,
  alpha: number
) => {
  if (!quality) return;

  const colors: { [key: string]: string } = {
    perfect: '#2ecc71',
    good: '#3498db',
    early: '#f39c12',
    late: '#e67e22',
    miss: '#e74c3c',
  };

  const texts: { [key: string]: string } = {
    perfect: 'PERFECT!',
    good: 'Good',
    early: 'Early',
    late: 'Late',
    miss: 'Miss',
  };

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = colors[quality];
  ctx.fillText(texts[quality], x, y);
  ctx.restore();
};

export const renderScore = (
  ctx: CanvasRenderingContext2D,
  playerScore: [number, number],
  opponentScore: [number, number],
  serving: 'player' | 'opponent',
  width: number
) => {
  const scoreY = 40;
  
  // Score background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(width / 2 - 100, 10, 200, 50);
  
  // Score text
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';
  
  const pointNames = ['0', '15', '30', '40'];
  const playerPoints = pointNames[Math.min(playerScore[1], 3)] || playerScore[1].toString();
  const opponentPoints = pointNames[Math.min(opponentScore[1], 3)] || opponentScore[1].toString();
  
  // Serving indicator
  const servingDot = serving === 'player' ? '●' : '';
  const oppServingDot = serving === 'opponent' ? '●' : '';
  
  ctx.fillStyle = '#3498db';
  ctx.fillText(`${servingDot} ${playerScore[0]}`, width / 2 - 50, scoreY);
  
  ctx.fillStyle = 'white';
  ctx.fillText('-', width / 2, scoreY);
  
  ctx.fillStyle = '#e74c3c';
  ctx.fillText(`${opponentScore[0]} ${oppServingDot}`, width / 2 + 50, scoreY);
  
  // Current game points
  ctx.font = '14px Arial';
  ctx.fillStyle = '#bdc3c7';
  ctx.fillText(`${playerPoints} - ${opponentPoints}`, width / 2, scoreY + 20);
};

export const renderTimingBar = (
  ctx: CanvasRenderingContext2D,
  progress: number, // 0 to 1
  x: number,
  y: number,
  width: number
) => {
  const barHeight = 10;
  
  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, width, barHeight);
  
  // Progress zones
  const perfectStart = 0.4;
  const perfectEnd = 0.6;
  
  // Early zone
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(x, y, width * perfectStart, barHeight);
  
  // Perfect zone
  ctx.fillStyle = '#2ecc71';
  ctx.fillRect(x + width * perfectStart, y, width * (perfectEnd - perfectStart), barHeight);
  
  // Late zone
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(x + width * perfectEnd, y, width * (1 - perfectEnd), barHeight);
  
  // Indicator
  const indicatorX = x + width * progress;
  ctx.fillStyle = 'white';
  ctx.fillRect(indicatorX - 2, y - 3, 4, barHeight + 6);
};
