// Racing Thunder - Renderer Module

import { GameState, Particle, PlayerState, Vehicle, Track, Opponent, PowerUp, TRACK_WIDTH } from './types';
import { getEnvironmentColors } from './tracks';

const ROAD_SEGMENT_LENGTH = 100;
const DRAW_DISTANCE = 2000;
const CAMERA_HEIGHT = 150;
const CAMERA_DEPTH = 300;

interface ProjectedPoint {
  x: number;
  y: number;
  w: number;
  scale: number;
}

function project(
  x: number, 
  y: number, 
  z: number, 
  cameraZ: number,
  width: number,
  height: number
): ProjectedPoint {
  const scale = CAMERA_DEPTH / (z - cameraZ);
  return {
    x: Math.round(width / 2 + scale * x * width / 2),
    y: Math.round(height / 2 - scale * y * height / 2),
    w: Math.round(scale * TRACK_WIDTH * width / 2),
    scale,
  };
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  width: number,
  height: number
) {
  if (!gs.track || !gs.vehicle) return;
  
  const colors = getEnvironmentColors(gs.track.environment);
  const playerZ = gs.player.z;
  
  // Clear and draw sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height / 2);
  skyGradient.addColorStop(0, colors.sky);
  skyGradient.addColorStop(1, adjustColor(colors.sky, 20));
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height / 2);
  
  // Draw ground
  ctx.fillStyle = colors.ground;
  ctx.fillRect(0, height / 2, width, height / 2);
  
  // Draw road segments
  const baseSegment = Math.floor(playerZ / ROAD_SEGMENT_LENGTH);
  
  for (let n = DRAW_DISTANCE / ROAD_SEGMENT_LENGTH; n > 0; n--) {
    const segmentIndex = baseSegment + n;
    const z1 = segmentIndex * ROAD_SEGMENT_LENGTH;
    const z2 = z1 + ROAD_SEGMENT_LENGTH;
    
    const curve = getCurveAtPosition(gs.track, z1 % gs.track.length);
    const curveOffset = curve * (z1 - playerZ) * 0.001;
    
    const p1 = project(curveOffset - gs.player.x * 0.5, 0, z1, playerZ - CAMERA_DEPTH, width, height);
    const p2 = project(curveOffset - gs.player.x * 0.5, 0, z2, playerZ - CAMERA_DEPTH, width, height);
    
    if (p1.y < 0 && p2.y < 0) continue;
    if (p1.y > height && p2.y > height) continue;
    
    // Draw road segment
    const isAlternate = segmentIndex % 2 === 0;
    ctx.fillStyle = isAlternate ? colors.road : adjustColor(colors.road, -10);
    
    ctx.beginPath();
    ctx.moveTo(p1.x - p1.w, p1.y);
    ctx.lineTo(p1.x + p1.w, p1.y);
    ctx.lineTo(p2.x + p2.w, p2.y);
    ctx.lineTo(p2.x - p2.w, p2.y);
    ctx.closePath();
    ctx.fill();
    
    // Draw road stripes
    const stripeWidth = p1.w * 0.02;
    ctx.fillStyle = colors.stripe;
    
    // Center stripe (dashed)
    if (isAlternate) {
      ctx.fillRect(p1.x - stripeWidth, p1.y, stripeWidth * 2, p2.y - p1.y);
    }
    
    // Edge stripes
    ctx.fillRect(p1.x - p1.w + stripeWidth, p1.y, stripeWidth * 2, p2.y - p1.y);
    ctx.fillRect(p1.x + p1.w - stripeWidth * 3, p1.y, stripeWidth * 2, p2.y - p1.y);
    
    // Draw obstacles
    gs.track.obstacles.forEach(obstacle => {
      const obsZ = obstacle.z + Math.floor(playerZ / gs.track!.length) * gs.track!.length;
      if (obsZ > z1 && obsZ <= z2) {
        renderObstacle(ctx, obstacle, obsZ, playerZ, gs.player.x, width, height, colors);
      }
    });
    
    // Draw power-ups
    gs.powerUps.forEach(pu => {
      if (!pu.collected && pu.z > z1 && pu.z <= z2) {
        renderPowerUp(ctx, pu, playerZ, gs.player.x, width, height);
      }
    });
    
    // Draw opponents
    gs.opponents.forEach(opp => {
      if (opp.z > z1 && opp.z <= z2) {
        renderOpponent(ctx, opp, playerZ, gs.player.x, width, height);
      }
    });
  }
  
  // Draw player vehicle
  renderPlayerVehicle(ctx, gs.vehicle, gs.player, gs.race, width, height);
  
  // Draw particles
  gs.particles.forEach(p => renderParticle(ctx, p, playerZ, gs.player.x, width, height));
  
  // Draw HUD
  renderHUD(ctx, gs, width, height);
  
  // Draw countdown
  if (gs.countdown > 0) {
    renderCountdown(ctx, gs.countdown, width, height);
  }
}

function getCurveAtPosition(track: Track, position: number): number {
  let curveValue = 0;
  track.curves.forEach(curve => {
    const dist = Math.abs(position - curve.position);
    if (dist < 200) {
      const influence = 1 - dist / 200;
      curveValue += (curve.direction === 'left' ? -1 : 1) * curve.intensity * influence;
    }
  });
  return curveValue;
}

function renderPlayerVehicle(
  ctx: CanvasRenderingContext2D,
  vehicle: Vehicle,
  player: PlayerState,
  race: any,
  width: number,
  height: number
) {
  const centerX = width / 2 + player.x * width * 0.1;
  const baseY = height * 0.85;
  const vehicleWidth = vehicle.type === 'car' ? 80 : 50;
  const vehicleHeight = vehicle.type === 'car' ? 45 : 70;
  
  ctx.save();
  ctx.translate(centerX, baseY);
  ctx.rotate(player.driftAngle * 0.02);
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, vehicleHeight / 2 + 5, vehicleWidth * 0.8, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  if (vehicle.type === 'car') {
    // Car body
    ctx.fillStyle = vehicle.color;
    
    // Main body
    ctx.beginPath();
    ctx.roundRect(-vehicleWidth / 2, -vehicleHeight / 2, vehicleWidth, vehicleHeight, 10);
    ctx.fill();
    
    // Roof
    ctx.fillStyle = adjustColor(vehicle.color, -20);
    ctx.beginPath();
    ctx.roundRect(-vehicleWidth / 3, -vehicleHeight / 2 - 15, vehicleWidth / 1.5, 25, 8);
    ctx.fill();
    
    // Windshield
    ctx.fillStyle = '#1e40af';
    ctx.beginPath();
    ctx.roundRect(-vehicleWidth / 3.5, -vehicleHeight / 2 - 12, vehicleWidth / 2, 18, 5);
    ctx.fill();
    
    // Accent stripes
    ctx.fillStyle = vehicle.accentColor;
    ctx.fillRect(-vehicleWidth / 2 + 5, -2, vehicleWidth - 10, 4);
    
    // Wheels
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.ellipse(-vehicleWidth / 2 + 8, vehicleHeight / 2 - 5, 12, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(vehicleWidth / 2 - 8, vehicleHeight / 2 - 5, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Headlights
    if (race.nitroActive) {
      ctx.fillStyle = '#22d3ee';
    } else {
      ctx.fillStyle = '#fef08a';
    }
    ctx.beginPath();
    ctx.ellipse(-vehicleWidth / 2 + 15, -vehicleHeight / 2 + 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(vehicleWidth / 2 - 15, -vehicleHeight / 2 + 8, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
  } else {
    // Bike body
    ctx.fillStyle = vehicle.color;
    
    // Frame
    ctx.beginPath();
    ctx.moveTo(-10, -vehicleHeight / 2);
    ctx.lineTo(10, -vehicleHeight / 2);
    ctx.lineTo(15, vehicleHeight / 2 - 10);
    ctx.lineTo(-15, vehicleHeight / 2 - 10);
    ctx.closePath();
    ctx.fill();
    
    // Front fairing
    ctx.fillStyle = adjustColor(vehicle.color, 15);
    ctx.beginPath();
    ctx.moveTo(-15, -vehicleHeight / 2 - 10);
    ctx.lineTo(15, -vehicleHeight / 2 - 10);
    ctx.lineTo(10, -vehicleHeight / 2 + 10);
    ctx.lineTo(-10, -vehicleHeight / 2 + 10);
    ctx.closePath();
    ctx.fill();
    
    // Windscreen
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.moveTo(-8, -vehicleHeight / 2 - 5);
    ctx.lineTo(8, -vehicleHeight / 2 - 5);
    ctx.lineTo(6, -vehicleHeight / 2 + 5);
    ctx.lineTo(-6, -vehicleHeight / 2 + 5);
    ctx.closePath();
    ctx.fill();
    
    // Rider
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.ellipse(0, -10, 12, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Helmet
    ctx.fillStyle = vehicle.accentColor;
    ctx.beginPath();
    ctx.ellipse(0, -25, 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Wheels
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.ellipse(0, -vehicleHeight / 2 - 5, 8, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(0, vehicleHeight / 2, 10, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Headlight
    if (race.nitroActive) {
      ctx.fillStyle = '#22d3ee';
    } else {
      ctx.fillStyle = '#fef08a';
    }
    ctx.beginPath();
    ctx.ellipse(0, -vehicleHeight / 2 - 15, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Nitro effect
  if (race.nitroActive) {
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const flameY = vehicleHeight / 2 + 10 + i * 15 + Math.random() * 10;
      const flameWidth = 15 - i * 4;
      ctx.ellipse(0, flameY, flameWidth, 8, 0, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  // Shield effect
  if (race.shieldActive) {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(0, 0, vehicleWidth * 0.8, vehicleHeight * 0.8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  ctx.restore();
}

function renderOpponent(
  ctx: CanvasRenderingContext2D,
  opponent: Opponent,
  playerZ: number,
  playerX: number,
  width: number,
  height: number
) {
  const relZ = opponent.z - playerZ;
  if (relZ < 0 || relZ > DRAW_DISTANCE) return;
  
  const p = project(opponent.x - playerX * 0.5, 0, opponent.z, playerZ - CAMERA_DEPTH, width, height);
  const scale = p.scale * 100;
  
  if (scale < 5) return;
  
  const vehicle = opponent.vehicle;
  const vWidth = (vehicle.type === 'car' ? 80 : 50) * p.scale * 0.8;
  const vHeight = (vehicle.type === 'car' ? 45 : 70) * p.scale * 0.8;
  
  ctx.save();
  ctx.translate(p.x, p.y);
  
  // Simple vehicle shape
  ctx.fillStyle = vehicle.color;
  if (vehicle.type === 'car') {
    ctx.beginPath();
    ctx.roundRect(-vWidth / 2, -vHeight, vWidth, vHeight, vWidth * 0.1);
    ctx.fill();
    
    // Roof
    ctx.fillStyle = adjustColor(vehicle.color, -20);
    ctx.beginPath();
    ctx.roundRect(-vWidth / 3, -vHeight - vHeight * 0.3, vWidth / 1.5, vHeight * 0.4, vWidth * 0.08);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, -vHeight / 2, vWidth / 2, vHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

function renderObstacle(
  ctx: CanvasRenderingContext2D,
  obstacle: any,
  obsZ: number,
  playerZ: number,
  playerX: number,
  width: number,
  height: number,
  colors: any
) {
  const p = project(obstacle.x - playerX * 0.5, 0, obsZ, playerZ - CAMERA_DEPTH, width, height);
  const scale = p.scale * 50;
  
  if (scale < 2) return;
  
  ctx.save();
  ctx.translate(p.x, p.y);
  
  switch (obstacle.type) {
    case 'barrier':
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-scale * obstacle.width, -scale * 0.8, scale * obstacle.width * 2, scale * 0.8);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(-scale * obstacle.width, -scale * 0.6, scale * obstacle.width * 0.4, scale * 0.4);
      break;
    case 'cone':
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, -scale * 0.6);
      ctx.lineTo(-scale * 0.3, 0);
      ctx.lineTo(scale * 0.3, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 'rock':
      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.ellipse(0, -scale * 0.3, scale * obstacle.width, scale * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'oil':
      ctx.fillStyle = 'rgba(30, 30, 30, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 0, scale * obstacle.width, scale * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  ctx.restore();
}

function renderPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
  playerZ: number,
  playerX: number,
  width: number,
  height: number
) {
  const p = project(powerUp.x - playerX * 0.5, 0.5, powerUp.z, playerZ - CAMERA_DEPTH, width, height);
  const scale = p.scale * 40;
  
  if (scale < 3) return;
  
  const colors: Record<string, string> = {
    nitro: '#06b6d4',
    shield: '#3b82f6',
    magnet: '#f59e0b',
    slowmo: '#8b5cf6',
    repair: '#22c55e',
  };
  
  ctx.save();
  ctx.translate(p.x, p.y);
  
  // Glow
  ctx.shadowColor = colors[powerUp.type];
  ctx.shadowBlur = 15;
  
  // Outer ring
  ctx.strokeStyle = colors[powerUp.type];
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, scale, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner fill
  ctx.fillStyle = colors[powerUp.type] + '80';
  ctx.beginPath();
  ctx.arc(0, 0, scale * 0.7, 0, Math.PI * 2);
  ctx.fill();
  
  // Icon
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${scale}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const icons: Record<string, string> = {
    nitro: '⚡',
    shield: '🛡',
    magnet: '🧲',
    slowmo: '⏱',
    repair: '🔧',
  };
  ctx.fillText(icons[powerUp.type], 0, 0);
  
  ctx.restore();
}

function renderParticle(
  ctx: CanvasRenderingContext2D,
  particle: Particle,
  playerZ: number,
  playerX: number,
  width: number,
  height: number
) {
  if (particle.life <= 0) return;
  
  const alpha = particle.life / particle.maxLife;
  const p = project(particle.x - playerX * 0.5, particle.y, particle.z, playerZ - CAMERA_DEPTH, width, height);
  
  if (p.scale < 0.01) return;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, particle.size * p.scale * 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderHUD(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  width: number,
  height: number
) {
  const padding = 20;
  
  // Speed gauge (bottom center)
  const speedGaugeWidth = 200;
  const speedGaugeHeight = 60;
  const speedX = width / 2 - speedGaugeWidth / 2;
  const speedY = height - speedGaugeHeight - padding;
  
  // Gauge background
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(speedX, speedY, speedGaugeWidth, speedGaugeHeight, 10);
  ctx.fill();
  
  // Speed bar
  const speedPercent = gs.race.speed / gs.race.maxSpeed;
  const barGradient = ctx.createLinearGradient(speedX + 10, 0, speedX + speedGaugeWidth - 10, 0);
  barGradient.addColorStop(0, '#22c55e');
  barGradient.addColorStop(0.6, '#eab308');
  barGradient.addColorStop(1, '#ef4444');
  ctx.fillStyle = barGradient;
  ctx.fillRect(speedX + 10, speedY + 35, (speedGaugeWidth - 20) * speedPercent, 15);
  
  // Speed text
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(gs.race.speed)} km/h`, width / 2, speedY + 25);
  
  // Position (top left)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(padding, padding, 100, 50, 10);
  ctx.fill();
  
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${gs.race.position}`, padding + 35, padding + 38);
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px Arial';
  ctx.fillText(`/${gs.opponents.length + 1}`, padding + 70, padding + 38);
  
  // Lap counter (top center)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 60, padding, 120, 40, 10);
  ctx.fill();
  
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`LAP ${gs.race.lap}/${gs.race.totalLaps}`, width / 2, padding + 28);
  
  // Time (top right)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(width - 120 - padding, padding, 120, 40, 10);
  ctx.fill();
  
  const minutes = Math.floor(gs.race.time / 60);
  const seconds = Math.floor(gs.race.time % 60);
  const ms = Math.floor((gs.race.time % 1) * 100);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, width - 60 - padding, padding + 27);
  
  // Nitro bar (bottom left)
  const nitroWidth = 150;
  const nitroHeight = 20;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(padding, height - nitroHeight - padding - 30, nitroWidth + 20, nitroHeight + 30, 10);
  ctx.fill();
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('NITRO', padding + 10, height - nitroHeight - padding - 12);
  
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(padding + 10, height - nitroHeight - padding, nitroWidth, nitroHeight);
  
  const nitroGradient = ctx.createLinearGradient(padding + 10, 0, padding + 10 + nitroWidth, 0);
  nitroGradient.addColorStop(0, '#06b6d4');
  nitroGradient.addColorStop(1, '#0ea5e9');
  ctx.fillStyle = nitroGradient;
  ctx.fillRect(padding + 10, height - nitroHeight - padding, nitroWidth * gs.race.nitroAmount, nitroHeight);
  
  if (gs.race.nitroActive) {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding + 10, height - nitroHeight - padding, nitroWidth, nitroHeight);
  }
  
  // Health bar (bottom right)
  const healthWidth = 150;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(width - healthWidth - padding - 20, height - nitroHeight - padding - 30, healthWidth + 20, nitroHeight + 30, 10);
  ctx.fill();
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('HEALTH', width - healthWidth - padding - 10, height - nitroHeight - padding - 12);
  
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(width - healthWidth - padding - 10, height - nitroHeight - padding, healthWidth, nitroHeight);
  
  const healthPercent = gs.race.health / 100;
  const healthColor = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
  ctx.fillStyle = healthColor;
  ctx.fillRect(width - healthWidth - padding - 10, height - nitroHeight - padding, healthWidth * healthPercent, nitroHeight);
  
  // Coins (top right area)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(width - 100 - padding, padding + 50, 100, 30, 8);
  ctx.fill();
  
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`🪙 ${gs.race.coins}`, width - padding - 10, padding + 72);
}

function renderCountdown(
  ctx: CanvasRenderingContext2D,
  countdown: number,
  width: number,
  height: number
) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, width, height);
  
  const text = countdown > 0 ? Math.ceil(countdown).toString() : 'GO!';
  const size = countdown > 0 ? 150 : 120;
  
  ctx.fillStyle = countdown > 0 ? '#fff' : '#22c55e';
  ctx.font = `bold ${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = countdown > 0 ? '#000' : '#22c55e';
  ctx.shadowBlur = 20;
  ctx.fillText(text, width / 2, height / 2);
  ctx.shadowBlur = 0;
}

export function renderResults(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  width: number,
  height: number,
  coinsEarned: number,
  xpEarned: number
) {
  // Background overlay
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, width, height);
  
  const centerX = width / 2;
  const startY = height * 0.15;
  
  // Title
  const isWin = gs.race.position === 1;
  ctx.fillStyle = isWin ? '#fbbf24' : '#9ca3af';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(isWin ? '🏆 VICTORY!' : 'RACE COMPLETE', centerX, startY);
  
  // Position
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px Arial';
  ctx.fillText(`${gs.race.position}${getOrdinalSuffix(gs.race.position)} Place`, centerX, startY + 100);
  
  // Stats box
  const boxWidth = 300;
  const boxHeight = 200;
  const boxX = centerX - boxWidth / 2;
  const boxY = startY + 140;
  
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
  ctx.fill();
  
  ctx.fillStyle = '#9ca3af';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  
  const stats = [
    { label: 'Time', value: formatTime(gs.race.time) },
    { label: 'Top Speed', value: `${Math.round(gs.race.maxSpeed)} km/h` },
    { label: 'Coins Collected', value: gs.race.coins.toString() },
    { label: 'Coins Earned', value: `+${coinsEarned}` },
    { label: 'XP Earned', value: `+${xpEarned}` },
  ];
  
  stats.forEach((stat, i) => {
    const y = boxY + 35 + i * 35;
    ctx.fillStyle = '#9ca3af';
    ctx.textAlign = 'left';
    ctx.fillText(stat.label, boxX + 20, y);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(stat.value, boxX + boxWidth - 20, y);
  });
  
  // Continue prompt
  ctx.fillStyle = '#6b7280';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Press SPACE or click to continue', centerX, height - 60);
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
