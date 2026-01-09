import { Player, Enemy, Projectile, Particle, PowerUp, GameState } from './types';

const NEON_COLORS = {
  cyan: '#00ffff',
  magenta: '#ff00ff',
  green: '#00ff00',
  yellow: '#ffff00',
  red: '#ff0044',
  purple: '#8000ff',
  orange: '#ff8800',
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  player: Player,
  enemies: Enemy[],
  projectiles: Projectile[],
  particles: Particle[],
  powerUps: PowerUp[],
  gameState: GameState,
  time: number
) => {
  // Clear with dark background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  renderGrid(ctx, canvas, time);

  // Draw power-ups
  powerUps.forEach(p => renderPowerUp(ctx, p, time));

  // Draw particles (behind entities)
  particles.filter(p => p.type === 'trail').forEach(p => renderParticle(ctx, p));

  // Draw projectiles
  projectiles.forEach(p => renderProjectile(ctx, p));

  // Draw enemies
  enemies.forEach(e => renderEnemy(ctx, e, time));

  // Draw player
  renderPlayer(ctx, player, time);

  // Draw particles (in front)
  particles.filter(p => p.type !== 'trail').forEach(p => renderParticle(ctx, p));

  // Draw HUD
  renderHUD(ctx, canvas, player, gameState);
};

const renderGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
  const gridSize = 50;
  const offset = (time * 0.02) % gridSize;

  ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = -offset; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = -offset; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
};

const renderPlayer = (ctx: CanvasRenderingContext2D, player: Player, time: number) => {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);

  // Glow effect
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();

  // Shield effect
  if (player.shield > 0) {
    const shieldPulse = Math.sin(time * 0.005) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(0, 200, 255, ${shieldPulse * (player.shield / player.maxShield)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Body
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -12);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-15, 12);
  ctx.closePath();
  ctx.fill();

  // Inner detail
  ctx.fillStyle = '#001a1a';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();

  // Core
  const corePulse = Math.sin(time * 0.01) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255, 255, 255, ${corePulse})`;
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

const renderEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  // Glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size * 1.5);
  gradient.addColorStop(0, enemy.glowColor);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.size * 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(enemy.angle);

  switch (enemy.type) {
    case 'drone':
      renderDrone(ctx, enemy, time);
      break;
    case 'sentinel':
      renderSentinel(ctx, enemy, time);
      break;
    case 'phantom':
      renderPhantom(ctx, enemy, time);
      break;
    case 'juggernaut':
      renderJuggernaut(ctx, enemy, time);
      break;
    case 'sniper':
      renderSniper(ctx, enemy, time);
      break;
    case 'boss':
      renderBoss(ctx, enemy, time);
      break;
  }

  ctx.restore();

  // Health bar
  if (enemy.health < enemy.maxHealth) {
    const barWidth = enemy.size * 2;
    const barHeight = 4;
    const healthPercent = enemy.health / enemy.maxHealth;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 10, barWidth, barHeight);

    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.size - 10, barWidth * healthPercent, barHeight);
  }
};

const renderDrone = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
  ctx.fill();

  // Rotating ring
  ctx.strokeStyle = 'rgba(255, 0, 100, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.size + 3, time * 0.01, time * 0.01 + Math.PI * 1.5);
  ctx.stroke();
};

const renderSentinel = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.moveTo(enemy.size, 0);
  for (let i = 1; i < 6; i++) {
    const angle = (i * Math.PI * 2) / 6;
    const radius = i % 2 === 0 ? enemy.size : enemy.size * 0.6;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();

  // Core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
};

const renderPhantom = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  const alpha = 0.5 + Math.sin(time * 0.008) * 0.3;
  ctx.globalAlpha = alpha;
  
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, enemy.size, enemy.size * 1.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-5, -3, 3, 0, Math.PI * 2);
  ctx.arc(5, -3, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
};

const renderJuggernaut = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  ctx.fillStyle = enemy.color;
  ctx.fillRect(-enemy.size, -enemy.size, enemy.size * 2, enemy.size * 2);

  // Armor plates
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 3;
  ctx.strokeRect(-enemy.size + 3, -enemy.size + 3, enemy.size * 2 - 6, enemy.size * 2 - 6);

  // Core
  ctx.fillStyle = '#ff4400';
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
};

const renderSniper = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  // Body
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.moveTo(enemy.size, 0);
  ctx.lineTo(-enemy.size, -enemy.size * 0.5);
  ctx.lineTo(-enemy.size, enemy.size * 0.5);
  ctx.closePath();
  ctx.fill();

  // Scope
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(enemy.size, 0);
  ctx.lineTo(enemy.size + 50, 0);
  ctx.stroke();

  // Scope glow
  const scopeAlpha = Math.sin(time * 0.01) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 0, 0, ${scopeAlpha})`;
  ctx.beginPath();
  ctx.arc(enemy.size + 50, 0, 4, 0, Math.PI * 2);
  ctx.fill();
};

const renderBoss = (ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) => {
  // Outer ring
  ctx.strokeStyle = enemy.color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring (rotating)
  ctx.save();
  ctx.rotate(time * 0.002);
  ctx.strokeStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(0, 0, enemy.size * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Core
  const coreSize = enemy.size * 0.4 + Math.sin(time * 0.005) * 5;
  ctx.fillStyle = '#ff0044';
  ctx.beginPath();
  ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + time * 0.001;
    const eyeX = Math.cos(angle) * enemy.size * 0.5;
    const eyeY = Math.sin(angle) * enemy.size * 0.5;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
    ctx.fill();
  }
};

const renderProjectile = (ctx: CanvasRenderingContext2D, projectile: Projectile) => {
  // Trail
  if (projectile.trail.length > 1) {
    ctx.beginPath();
    ctx.moveTo(projectile.trail[0].x, projectile.trail[0].y);
    for (let i = 1; i < projectile.trail.length; i++) {
      ctx.lineTo(projectile.trail[i].x, projectile.trail[i].y);
    }
    ctx.strokeStyle = projectile.color + '40';
    ctx.lineWidth = projectile.size;
    ctx.stroke();
  }

  // Glow
  const gradient = ctx.createRadialGradient(
    projectile.x, projectile.y, 0,
    projectile.x, projectile.y, projectile.size * 3
  );
  gradient.addColorStop(0, projectile.color);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, projectile.size * 3, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, projectile.size * 0.5, 0, Math.PI * 2);
  ctx.fill();
};

const renderParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  const alpha = particle.life / particle.maxLife;
  ctx.globalAlpha = alpha;

  switch (particle.type) {
    case 'explosion':
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 - alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'spark':
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
      break;

    case 'trail':
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'shield':
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 + (1 - alpha) * 2), 0, Math.PI * 2);
      ctx.stroke();
      break;

    case 'energy':
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  ctx.globalAlpha = 1;
};

const renderPowerUp = (ctx: CanvasRenderingContext2D, powerUp: PowerUp, time: number) => {
  const pulse = Math.sin(time * 0.005 + powerUp.pulsePhase) * 0.3 + 0.7;
  const size = 15 * pulse;

  // Glow
  const gradient = ctx.createRadialGradient(
    powerUp.x, powerUp.y, 0,
    powerUp.x, powerUp.y, 30
  );
  gradient.addColorStop(0, powerUp.glowColor);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, 30, 0, Math.PI * 2);
  ctx.fill();

  // Icon
  ctx.fillStyle = powerUp.color;
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, size, 0, Math.PI * 2);
  ctx.fill();

  // Symbol
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const symbols: Record<string, string> = {
    health: '+',
    shield: '◇',
    energy: '⚡',
    damage: '↑',
    speed: '»',
  };
  ctx.fillText(symbols[powerUp.type] || '?', powerUp.x, powerUp.y);
};

const renderHUD = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  player: Player,
  gameState: GameState
) => {
  const padding = 20;

  // Health bar
  renderStatusBar(ctx, padding, padding, 200, 20, player.health, player.maxHealth, '#00ff00', 'HEALTH');

  // Shield bar
  renderStatusBar(ctx, padding, padding + 30, 200, 15, player.shield, player.maxShield, '#00aaff', 'SHIELD');

  // Energy bar
  renderStatusBar(ctx, padding, padding + 55, 200, 15, player.energy, player.maxEnergy, '#ffaa00', 'ENERGY');

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE: ${gameState.score.toLocaleString()}`, canvas.width - padding, padding + 20);

  // Wave
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`WAVE ${gameState.wave}`, canvas.width - padding, padding + 45);

  // Combo
  if (gameState.combo > 1) {
    const comboAlpha = Math.min(1, gameState.comboTimer / 500);
    ctx.fillStyle = `rgba(255, 255, 0, ${comboAlpha})`;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`COMBO x${gameState.combo}`, canvas.width - padding, padding + 70);
  }

  // Weapon
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(player.weapon.name.toUpperCase(), padding, canvas.height - padding - 30);

  // Abilities
  player.abilities.forEach((ability, index) => {
    const x = padding + index * 60;
    const y = canvas.height - padding;
    const ready = ability.currentCooldown <= 0 && player.energy >= ability.energyCost;

    ctx.fillStyle = ready ? 'rgba(0, 255, 255, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    ctx.fillRect(x, y - 50, 50, 50);

    if (ability.currentCooldown > 0) {
      const cooldownPercent = ability.currentCooldown / ability.cooldown;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, y - 50, 50, 50 * cooldownPercent);
    }

    ctx.strokeStyle = ready ? '#00ffff' : '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y - 50, 50, 50);

    ctx.fillStyle = ready ? '#ffffff' : '#666666';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(ability.icon, x + 25, y - 18);

    ctx.font = '10px monospace';
    ctx.fillText(`[${index + 1}]`, x + 25, y - 40);
  });
};

const renderStatusBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  value: number,
  maxValue: number,
  color: string,
  label: string
) => {
  const percent = Math.max(0, value / maxValue);

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x, y, width, height);

  // Fill
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * percent, height);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${height - 4}px monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + 5, y + height / 2);

  // Value
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(value)}/${maxValue}`, x + width - 5, y + height / 2);
};

export const renderMenu = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  highScore: number,
  highestWave: number,
  time: number
) => {
  // Background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderGrid(ctx, canvas, time);

  // Title glow
  const titleGradient = ctx.createLinearGradient(0, 150, 0, 220);
  titleGradient.addColorStop(0, '#00ffff');
  titleGradient.addColorStop(0.5, '#ff00ff');
  titleGradient.addColorStop(1, '#00ffff');

  ctx.fillStyle = titleGradient;
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CYBER COMBAT', canvas.width / 2, 180);

  // Subtitle
  ctx.fillStyle = '#888888';
  ctx.font = '20px monospace';
  ctx.fillText('NEON ARENA SHOOTER', canvas.width / 2, 220);

  // Stats
  ctx.fillStyle = '#00ffff';
  ctx.font = '18px monospace';
  ctx.fillText(`HIGH SCORE: ${highScore.toLocaleString()}`, canvas.width / 2, 300);
  ctx.fillText(`HIGHEST WAVE: ${highestWave}`, canvas.width / 2, 330);

  // Instructions
  ctx.fillStyle = '#666666';
  ctx.font = '16px monospace';
  ctx.fillText('WASD - Move | Mouse - Aim | Click - Shoot', canvas.width / 2, 400);
  ctx.fillText('1-4 - Abilities | R - Reload Energy | ESC - Pause', canvas.width / 2, 425);

  // Start prompt
  const promptAlpha = Math.sin(time * 0.005) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(0, 255, 255, ${promptAlpha})`;
  ctx.font = 'bold 24px monospace';
  ctx.fillText('[ CLICK TO START ]', canvas.width / 2, 500);
};

export const renderPause = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = '#888888';
  ctx.font = '20px monospace';
  ctx.fillText('Press ESC to resume', canvas.width / 2, canvas.height / 2 + 40);
};

export const renderGameOver = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  score: number,
  wave: number,
  kills: number,
  isNewHighScore: boolean,
  time: number
) => {
  ctx.fillStyle = 'rgba(10, 0, 20, 0.9)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff0044';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTEM FAILURE', canvas.width / 2, 150);

  if (isNewHighScore) {
    const glowAlpha = Math.sin(time * 0.01) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
    ctx.font = 'bold 28px monospace';
    ctx.fillText('★ NEW HIGH SCORE ★', canvas.width / 2, 200);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, canvas.width / 2, 280);
  ctx.fillText(`WAVE REACHED: ${wave}`, canvas.width / 2, 320);
  ctx.fillText(`ENEMIES DESTROYED: ${kills}`, canvas.width / 2, 360);

  const promptAlpha = Math.sin(time * 0.005) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(0, 255, 255, ${promptAlpha})`;
  ctx.font = 'bold 20px monospace';
  ctx.fillText('[ CLICK TO RESTART ]', canvas.width / 2, 450);
};

export const renderWaveComplete = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  wave: number,
  waveName: string,
  time: number
) => {
  ctx.fillStyle = 'rgba(0, 20, 30, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00ff00';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('WAVE COMPLETE', canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = '#00ffff';
  ctx.font = '28px monospace';
  ctx.fillText(`${waveName}`, canvas.width / 2, canvas.height / 2 + 10);

  const promptAlpha = Math.sin(time * 0.008) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${promptAlpha})`;
  ctx.font = '20px monospace';
  ctx.fillText('Next wave starting...', canvas.width / 2, canvas.height / 2 + 60);
};
