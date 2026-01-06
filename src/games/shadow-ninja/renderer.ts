// Shadow Ninja Fight Renderer

import { Fighter, Particle, HitEffect, Enemy } from './types';

const GROUND_Y = 0.85;

export const renderBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: string,
  time: number
): void => {
  // Background gradient based on arena
  const gradients: { [key: string]: string[] } = {
    dojo: ['#2d1810', '#4a2818', '#6b3a20'],
    street: ['#1a1a2e', '#2d2d44', '#16213e'],
    temple: ['#1e3a5f', '#2d5478', '#3d6a8a'],
    mountain: ['#2c3e50', '#34495e', '#5d6d7e'],
    forest: ['#1a4d2e', '#2d6b3f', '#3d8b4f'],
    monastery: ['#4a3728', '#6b4a35', '#8b6a4a'],
    volcano: ['#3d1a1a', '#5c2828', '#8b3d3d'],
    glacier: ['#1a3a4d', '#2d5a7a', '#4d8ab0'],
    storm: ['#1a1a2e', '#2d2d4a', '#3d3d5e'],
    ruins: ['#3d3a35', '#5a5550', '#7a756a'],
    palace: ['#3d1a3d', '#5c2d5c', '#8b4a8b'],
    cavern: ['#1a1a1a', '#2d2d2d', '#3d3d3d'],
    inferno: ['#4d1a0a', '#7a2810', '#a03818'],
    throne: ['#2d1a3d', '#4a2d5c', '#6b4a7a'],
    void: ['#0a0a15', '#15152a', '#20203f']
  };

  const colors = gradients[background] || gradients.dojo;
  
  // Main gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Animated background elements
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 20; i++) {
    const x = ((time * 0.02 + i * 137) % (width + 100)) - 50;
    const y = (i * 73) % height;
    const size = 20 + (i % 3) * 10;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ground
  const groundY = height * GROUND_Y;
  const groundGradient = ctx.createLinearGradient(0, groundY, 0, height);
  groundGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
  groundGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Ground line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Arena boundaries
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);
};

export const renderFighter = (
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  width: number,
  height: number,
  isPlayer: boolean,
  colors: { primary: string; secondary: string; glow: string },
  time: number
): void => {
  const groundY = height * GROUND_Y;
  const x = fighter.x * width;
  const y = groundY - fighter.height;
  const w = fighter.width;
  const h = fighter.height;

  ctx.save();
  
  // Flip for facing direction
  if (fighter.facing === 'left') {
    ctx.translate(x + w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + w / 2), 0);
  }

  // Glow effect when attacking
  if (['punching', 'kicking', 'special'].includes(fighter.state)) {
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 20;
  }

  // Body
  const bodyGradient = ctx.createLinearGradient(x, y, x, y + h);
  bodyGradient.addColorStop(0, colors.primary);
  bodyGradient.addColorStop(1, colors.secondary);
  
  // Animation offset based on state
  let yOffset = 0;
  let rotation = 0;
  
  switch (fighter.state) {
    case 'idle':
      yOffset = Math.sin(time * 0.005) * 3;
      break;
    case 'walking':
      yOffset = Math.sin(time * 0.02) * 5;
      break;
    case 'jumping':
      rotation = -0.1;
      break;
    case 'punching':
      rotation = 0.1;
      break;
    case 'kicking':
      rotation = 0.15;
      break;
    case 'hit':
      yOffset = -5;
      break;
    case 'blocking':
      break;
    case 'knockdown':
      rotation = Math.PI / 4;
      yOffset = h * 0.3;
      break;
    case 'victory':
      yOffset = Math.sin(time * 0.01) * 8;
      break;
  }

  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rotation);
  ctx.translate(-(x + w / 2), -(y + h / 2));

  // Main body (ninja silhouette)
  ctx.fillStyle = bodyGradient;
  
  // Torso
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.4 + yOffset, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.15 + yOffset, w * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Mask/Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.15 + yOffset, w * 0.2, w * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = colors.glow;
  ctx.beginPath();
  ctx.arc(x + w * 0.4, y + h * 0.14 + yOffset, 3, 0, Math.PI * 2);
  ctx.arc(x + w * 0.6, y + h * 0.14 + yOffset, 3, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = colors.secondary;
  const legSpread = fighter.state === 'kicking' ? 0.3 : 0.15;
  
  // Left leg
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y + h * 0.6 + yOffset);
  ctx.lineTo(x + w * (0.3 - legSpread), y + h * 0.95);
  ctx.lineTo(x + w * (0.4 - legSpread), y + h * 0.95);
  ctx.lineTo(x + w * 0.45, y + h * 0.6 + yOffset);
  ctx.fill();

  // Right leg (extended if kicking)
  ctx.beginPath();
  if (fighter.state === 'kicking') {
    ctx.moveTo(x + w * 0.55, y + h * 0.6 + yOffset);
    ctx.lineTo(x + w * 1.1, y + h * 0.5);
    ctx.lineTo(x + w * 1.1, y + h * 0.6);
    ctx.lineTo(x + w * 0.65, y + h * 0.6 + yOffset);
  } else {
    ctx.moveTo(x + w * 0.55, y + h * 0.6 + yOffset);
    ctx.lineTo(x + w * (0.6 + legSpread), y + h * 0.95);
    ctx.lineTo(x + w * (0.7 + legSpread), y + h * 0.95);
    ctx.lineTo(x + w * 0.65, y + h * 0.6 + yOffset);
  }
  ctx.fill();

  // Arms
  const armExtend = fighter.state === 'punching' ? 0.4 : 0;
  
  // Left arm
  ctx.beginPath();
  ctx.moveTo(x + w * 0.25, y + h * 0.35 + yOffset);
  ctx.lineTo(x + w * 0.1, y + h * 0.5 + yOffset);
  ctx.lineTo(x + w * 0.15, y + h * 0.55 + yOffset);
  ctx.lineTo(x + w * 0.3, y + h * 0.4 + yOffset);
  ctx.fill();

  // Right arm (extended if punching)
  ctx.beginPath();
  ctx.moveTo(x + w * 0.75, y + h * 0.35 + yOffset);
  ctx.lineTo(x + w * (0.9 + armExtend), y + h * (0.35 - armExtend * 0.2) + yOffset);
  ctx.lineTo(x + w * (0.85 + armExtend), y + h * (0.4 - armExtend * 0.2) + yOffset);
  ctx.lineTo(x + w * 0.7, y + h * 0.4 + yOffset);
  ctx.fill();

  // Fist glow when punching
  if (fighter.state === 'punching') {
    ctx.beginPath();
    ctx.arc(x + w * (0.95 + armExtend), y + h * 0.32 + yOffset, 10, 0, Math.PI * 2);
    ctx.fillStyle = colors.glow;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Block effect
  if (fighter.isBlocking) {
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5 + Math.sin(time * 0.02) * 0.2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 + yOffset, w * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Stun effect
  if (fighter.isStunned) {
    ctx.fillStyle = '#ffff00';
    for (let i = 0; i < 3; i++) {
      const starX = x + w / 2 + Math.cos(time * 0.01 + i * 2) * 30;
      const starY = y - 10 + Math.sin(time * 0.015 + i * 2) * 10;
      ctx.beginPath();
      ctx.arc(starX, starY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
};

export const renderHealthBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  health: number,
  maxHealth: number,
  isPlayer: boolean,
  name: string
): void => {
  const healthPercent = health / maxHealth;
  const barHeight = 20;
  const padding = 3;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(x - padding, y - padding, width + padding * 2, barHeight + padding * 2);

  // Border
  ctx.strokeStyle = isPlayer ? '#4ecdc4' : '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - padding, y - padding, width + padding * 2, barHeight + padding * 2);

  // Health gradient
  const gradient = ctx.createLinearGradient(x, y, x + width * healthPercent, y);
  if (healthPercent > 0.5) {
    gradient.addColorStop(0, '#2ecc71');
    gradient.addColorStop(1, '#27ae60');
  } else if (healthPercent > 0.25) {
    gradient.addColorStop(0, '#f39c12');
    gradient.addColorStop(1, '#e67e22');
  } else {
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width * healthPercent, barHeight);

  // Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = isPlayer ? 'left' : 'right';
  ctx.fillText(name, isPlayer ? x : x + width, y - 8);

  // Health text
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.ceil(health)}/${maxHealth}`, x + width / 2, y + 15);
};

export const renderEnergyBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  energy: number,
  maxEnergy: number
): void => {
  const energyPercent = energy / maxEnergy;
  const barHeight = 10;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x, y, width, barHeight);

  // Energy bar
  const gradient = ctx.createLinearGradient(x, y, x + width * energyPercent, y);
  gradient.addColorStop(0, '#3498db');
  gradient.addColorStop(1, '#2980b9');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width * energyPercent, barHeight);

  // Border
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, barHeight);
};

export const renderRoundInfo = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  round: number,
  totalRounds: number,
  playerWins: number,
  enemyWins: number,
  timer: number
): void => {
  const centerX = width / 2;

  // Round indicator
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${round}/${totalRounds}`, centerX, 40);

  // Timer
  ctx.font = 'bold 36px Arial';
  const timerColor = timer <= 10 ? '#e74c3c' : '#ffffff';
  ctx.fillStyle = timerColor;
  ctx.fillText(Math.ceil(timer).toString(), centerX, 80);

  // Win indicators
  const indicatorY = 55;
  const spacing = 20;
  
  // Player wins (left)
  for (let i = 0; i < Math.ceil(totalRounds / 2); i++) {
    ctx.beginPath();
    ctx.arc(centerX - 80 - i * spacing, indicatorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < playerWins ? '#4ecdc4' : 'rgba(78, 205, 196, 0.3)';
    ctx.fill();
  }

  // Enemy wins (right)
  for (let i = 0; i < Math.ceil(totalRounds / 2); i++) {
    ctx.beginPath();
    ctx.arc(centerX + 80 + i * spacing, indicatorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = i < enemyWins ? '#ff6b6b' : 'rgba(255, 107, 107, 0.3)';
    ctx.fill();
  }
};

export const renderCombo = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  combo: number,
  time: number
): void => {
  if (combo < 2) return;

  const scale = 1 + Math.sin(time * 0.02) * 0.1;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  
  ctx.fillStyle = '#f39c12';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${combo} COMBO!`, 0, 0);
  
  ctx.restore();
};

export const renderParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number
): void => {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    
    switch (p.type) {
      case 'hit':
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'spark':
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.x * width, p.y * height - p.size);
        ctx.lineTo(p.x * width + p.size, p.y * height);
        ctx.lineTo(p.x * width, p.y * height + p.size);
        ctx.lineTo(p.x * width - p.size, p.y * height);
        ctx.closePath();
        ctx.fill();
        break;
      case 'smoke':
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size * (2 - alpha), 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'energy':
        const gradient = ctx.createRadialGradient(
          p.x * width, p.y * height, 0,
          p.x * width, p.y * height, p.size
        );
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x * width, p.y * height, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'confetti':
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x * width - p.size / 2, p.y * height - p.size / 2, p.size, p.size * 0.6);
        break;
    }
    
    ctx.globalAlpha = 1;
  });
};

export const renderHitEffects = (
  ctx: CanvasRenderingContext2D,
  effects: HitEffect[],
  width: number,
  height: number
): void => {
  effects.forEach(effect => {
    const alpha = effect.timer / 30;
    const scale = 1 + (1 - effect.timer / 30) * 0.5;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(effect.x * width, effect.y * height);
    ctx.scale(scale, scale);
    
    // Impact circle
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.strokeStyle = effect.type === 'critical' ? '#f39c12' : '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Damage number
    ctx.fillStyle = effect.type === 'critical' ? '#f39c12' : '#ff6b6b';
    ctx.font = `bold ${effect.type === 'critical' ? 28 : 22}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(`-${effect.damage}`, 0, -40 - (1 - alpha) * 20);
    
    if (effect.type === 'critical') {
      ctx.fillStyle = '#f39c12';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('CRITICAL!', 0, -60 - (1 - alpha) * 20);
    }
    
    ctx.restore();
  });
};

export const renderCountdown = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number,
  progress: number
): void => {
  const scale = 1 + (1 - progress) * 0.5;
  const alpha = progress;
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  
  // Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  if (count > 0) {
    ctx.fillText(count.toString(), 0, 0);
  } else {
    ctx.fillStyle = '#f39c12';
    ctx.fillText('FIGHT!', 0, 0);
  }
  
  ctx.restore();
};

export const renderVictoryScreen = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  winner: 'player' | 'enemy',
  time: number
): void => {
  // Overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, height);
  
  const scale = 1 + Math.sin(time * 0.005) * 0.05;
  
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  
  // Winner text
  ctx.fillStyle = winner === 'player' ? '#4ecdc4' : '#ff6b6b';
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(winner === 'player' ? 'VICTORY!' : 'DEFEAT', 0, -30);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText(winner === 'player' ? 'You won the round!' : 'Enemy won the round!', 0, 30);
  
  ctx.restore();
};
