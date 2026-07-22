// ============================================================
// AetherPaddle II - Main Game Engine
// ============================================================

import type {
  GameState, GameScreen, Brick, Ball, PowerUpEntity,
  QuestState, Paddle, PowerUpType, LevelConfig, LaserBeam,
} from './types';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAY_AREA_TOP, PLAY_AREA_HEIGHT, HUD_HEIGHT,
  PADDLE, BALL, BRICK, POWERUP, LIVES, SCORING, SHAKE,
  PARTICLES, TRANSITIONS, COLORS,
  POWERUP_DROP_CHANCE,
} from './constants';
import { LEVEL_CONFIGS, generateLayout, getDifficultyMultiplier } from './levels';
import {
  ballPaddleCollision, ballBricksCollision, ballWallCollision,
  ballOutOfBounds, powerUpPaddleCollision,
  updatePaddlePosition, updatePowerUpPosition, createBall,
} from './physics';
import {
  saveGameProgress, updateBestScore, updateUnlockedLevel, getSettings,
} from './storage';
import { gameAudio } from './audio';

export class GameEngine {
  state: GameState;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedDelta: number = 1000 / 60; // 60 FPS
  private powerUpImages: Map<string, HTMLImageElement> = new Map();
  private bgImage: HTMLImageElement | null = null;
  private onStateChange: (() => void) | null = null;
  private questTargetBrick: Brick | null = null;
  private isTouchInput: boolean = false;
  public sensitivity: number = 1.5;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = this.createInitialState();
    this.loadImages();
    this.sensitivity = getSettings().paddleSensitivity;
  }

  public setSensitivity(val: number): void {
    this.sensitivity = val;
  }

  private loadImages(): void {
    // Load power-up icons
    const types: PowerUpType[] = ['HyperBounce', 'Magnetism', 'AetherShield', 'TimeWarp'];
    const checkLoaded = () => {
      // Image loading complete
    };

    types.forEach((type) => {
      const img = new Image();
      img.src = POWERUP.icons[type];
      img.onload = checkLoaded;
      img.onerror = checkLoaded;
      this.powerUpImages.set(type, img);
    });

    const bg = new Image();
    bg.src = '/assets/bg-pattern.jpg';
    bg.onload = () => {
      this.bgImage = bg;
      checkLoaded();
    };
    bg.onerror = checkLoaded;
  }

  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback;
  }

  private emitStateChange(): void {
    this.onStateChange?.();
  }

  private levelStartScore: number = 0;

  private createInitialState(): GameState {
    return {
      screen: 'TITLE',
      phase: 'PHASE_A',
      level: 1,
      score: 0,
      lives: LIVES.initial,
      maxLives: LIVES.max,
      combo: 0,
      comboMultiplier: 1.0,
      difficultyMultiplier: 1.0,
      paddle: this.createPaddle(),
      balls: [],
      bricks: [],
      powerUps: [],
      activeBuffs: [],
      particles: [],
      starParticles: [],
      quest: this.createEmptyQuest(),
      screenShake: { intensity: 0, duration: 0 },
      timeWarpActive: false,
      timeWarpTimer: 0,
      shieldActive: false,
      mouseX: CANVAS_WIDTH / 2,
      isPaused: false,
      levelTransitionTimer: 0,
      gameOverTimer: 0,
      totalLevels: LEVEL_CONFIGS.length,
      breakRoomReady: false,
      bestScore: 0,
      unlockedLevel: 1,
      lasers: [],
      laserCooldown: 0,
    };
  }

  private createPaddle(): Paddle {
    return {
      x: CANVAS_WIDTH / 2,
      y: PADDLE.y,
      width: PADDLE.width,
      height: PADDLE.height,
      targetX: CANVAS_WIDTH / 2,
      squashScale: 1,
    };
  }

  private createEmptyQuest(): QuestState {
    return {
      active: false,
      type: 'Stabilization',
      description: '',
      timer: 0,
      maxTimer: 0,
      hitsRequired: 0,
      hitsCurrent: 0,
      completed: false,
      failed: false,
      fluxForceX: 0,
      fluxForceY: 0,
      fluxForceTimer: 0,
      fluxBricks: [],
    };
  }

  // ==================== GAME LIFECYCLE ====================

  startGame(resume: boolean = false): void {
    if (resume) {
      // Will be handled by caller loading progress
      this.state.screen = 'PLAYING';
    } else {
      this.state = this.createInitialState();
      this.state.screen = 'PLAYING';
      this.state.level = 1;
      this.loadLevel(1);
    }
    gameAudio.startMusic();
    this.emitStateChange();
  }

  loadLevel(levelNum: number): void {
    const config = LEVEL_CONFIGS[levelNum - 1];
    if (!config) return;

    this.state.level = levelNum;
    this.state.phase = 'PHASE_A';
    this.state.difficultyMultiplier = getDifficultyMultiplier(levelNum);
    this.state.combo = 0;
    this.state.comboMultiplier = 1.0;
    this.state.powerUps = [];
    this.state.activeBuffs = [];
    this.state.timeWarpActive = false;
    this.state.shieldActive = false;
    this.state.quest = this.createEmptyQuest();
    this.state.breakRoomReady = false;
    this.questTargetBrick = null;
    this.state.lasers = [];
    this.state.laserCooldown = 0;

    // Set lives based on milestone thresholds
    const livesForLevel = levelNum >= 16 ? 5 : levelNum >= 10 ? 4 : levelNum >= 6 ? 3 : LIVES.initial;
    this.state.lives = livesForLevel;
    this.state.maxLives = livesForLevel;

    // Record score at level start so retry can reset to it
    this.levelStartScore = this.state.score;

    // Generate bricks
    this.state.bricks = this.generateBricks(config);

    // Create ball — levels 6-10 get a 0.3 speed reduction
    const rawSpeed = config.ballSpeed * this.state.difficultyMultiplier;
    const speedOffset = (levelNum >= 6 && levelNum <= 10) ? -0.3 : 0;
    this.state.balls = [createBall(CANVAS_WIDTH / 2, PADDLE.y - 40, Math.min(rawSpeed + speedOffset, BALL.maxSpeed))];

    // Reset paddle
    this.state.paddle = this.createPaddle();

    this.emitStateChange();
  }

  private generateBricks(config: LevelConfig): Brick[] {
    const layouts = generateLayout(
      config.profile,
      config.rows,
      config.cols,
      config.multiHitRatio,
      config.indestructibleRatio
    );

    const brickWidth = BRICK.width;
    const brickHeight = BRICK.height;
    const padding = BRICK.padding;
    const totalWidth = config.cols * (brickWidth + padding);
    const startX = (CANVAS_WIDTH - totalWidth) / 2;

    return layouts.map((layout, index) => {
      const colorIdx = layout.row % config.brickColors.length;
      const baseColor = config.brickColors[colorIdx];
      let hp = 1;
      if (layout.type === 'multi2') hp = 2;
      if (layout.type === 'multi3') hp = 3;
      if (layout.type === 'indestructible') hp = 999;

      return {
        id: `brick_${index}`,
        x: startX + layout.col * (brickWidth + padding),
        y: PLAY_AREA_TOP + 4 + layout.row * (brickHeight + padding),
        width: brickWidth,
        height: brickHeight,
        type: layout.type,
        hp,
        maxHp: hp,
        color: baseColor,
        flashTimer: 0,
      };
    });
  }

  pauseGame(): void {
    if (this.state.screen === 'PLAYING') {
      this.state.screen = 'PAUSED';
      this.state.isPaused = true;
      gameAudio.stopMusic();
      this.emitStateChange();
    }
  }

  resumeGame(): void {
    if (this.state.screen === 'PAUSED') {
      this.state.screen = 'PLAYING';
      this.state.isPaused = false;
      this.lastTime = performance.now();
      gameAudio.startMusic();
      this.emitStateChange();
    }
  }

  quitToMenu(): void {
    this.state.screen = 'TITLE';
    this.state.isPaused = false;
    gameAudio.stopMusic();
    this.emitStateChange();
  }

  // ==================== INPUT HANDLING ====================

  handleMouseMove(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    this.state.mouseX = (clientX - rect.left) * scaleX;
  }

  handleTouchDelta(deltaX: number): void {
    this.isTouchInput = true;
    const halfWidth = this.state.paddle ? this.state.paddle.width / 2 : 60;
    const minX = halfWidth;
    const maxX = CANVAS_WIDTH - halfWidth;
    // Calculate new position starting from current paddle position to avoid deadzones at screen edges
    const currentX = this.state.paddle ? this.state.paddle.x : this.state.mouseX;
    this.state.mouseX = Math.max(minX, Math.min(maxX, currentX + deltaX * this.sensitivity));
  }

  handleMouseMoveDirect(mouseX: number, isTouch: boolean = false): void {
    this.isTouchInput = isTouch;
    this.state.mouseX = mouseX;
  }

  handleClick(): void {
    if (this.state.screen === 'TITLE') {
      // Title screen click handled by React
      return;
    }
    
    // Manual laser shooting on click
    if (this.state.screen === 'PLAYING' && this.state.activeBuffs.some(b => b.type === 'LaserPaddle')) {
      if (this.state.laserCooldown <= 10) { // allows slightly faster manual click spamming
        this.shootLasers();
        this.state.laserCooldown = 15; // 0.25s manual cooldown
      }
    }
  }

  // ==================== MAIN GAME LOOP ====================

  startLoop(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stopLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  private loop = (currentTime: number): void => {
    this.animFrameId = requestAnimationFrame(this.loop);

    const delta = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.state.isPaused) {
      this.render();
      return;
    }

    this.accumulator += delta;

    // Cap accumulator to prevent spiral-of-death when tab is backgrounded
    // (keeps max 5 fixed steps per frame)
    if (this.accumulator > this.fixedDelta * 5) {
      this.accumulator = this.fixedDelta * 5;
    }

    while (this.accumulator >= this.fixedDelta) {
      this.update();
      this.accumulator -= this.fixedDelta;
    }

    this.render();
  };

  // ==================== UPDATE ====================

  private update(): void {
    if (this.state.screen !== 'PLAYING') return;

    // Update paddle width based on active buffs
    let targetWidth = PADDLE.width;
    if (this.state.activeBuffs.some(b => b.type === 'ChaosZone')) {
      targetWidth = 50;
    } else if (this.state.activeBuffs.some(b => b.type === 'GrowPaddle')) {
      targetWidth = 170;
    } else if (this.state.activeBuffs.some(b => b.type === 'ShrinkPaddle')) {
      targetWidth = 70;
    }
    // Smoothly transition width
    this.state.paddle.width += (targetWidth - this.state.paddle.width) * 0.15;

    // Update paddle
    updatePaddlePosition(this.state.paddle, this.state.mouseX, this.isTouchInput);

    // Update buff timers
    this.updateBuffs();

    // Update ball speeds based on active buffs dynamically
    for (const ball of this.state.balls) {
      let speedMultiplier = 1.0;
      if (this.state.activeBuffs.some(b => b.type === 'ChaosZone')) {
        speedMultiplier *= 1.5;
      } else if (this.state.activeBuffs.some(b => b.type === 'SpeedUpBall')) {
        speedMultiplier *= 1.35;
      } else if (this.state.activeBuffs.some(b => b.type === 'HyperBounce')) {
        speedMultiplier *= 1.4;
      }
      
      if (this.state.activeBuffs.some(b => b.type === 'SlowDownBall')) {
        speedMultiplier *= 0.65;
      }

      const targetSpeed = Math.max(BALL.minSpeed, Math.min(ball.baseSpeed * speedMultiplier, BALL.maxSpeed));
      if (Math.abs(ball.speed - targetSpeed) > 0.01) {
        ball.speed = targetSpeed;
        const norm = this.normalizeBallVelocity(ball);
        ball.vx = norm.vx;
        ball.vy = norm.vy;
      }
    }

    // Update time warp
    if (this.state.timeWarpActive) {
      this.state.timeWarpTimer--;
      if (this.state.timeWarpTimer <= 0) {
        this.state.timeWarpActive = false;
        this.state.balls.forEach(b => b.frozen = false);
      }
    }

    // Update balls
    this.updateBalls();

    // Shoot lasers automatically if LaserPaddle is active
    if (this.state.activeBuffs.some(b => b.type === 'LaserPaddle')) {
      if (this.state.laserCooldown > 0) {
        this.state.laserCooldown--;
      }
      if (this.state.laserCooldown <= 0) {
        this.shootLasers();
        this.state.laserCooldown = 25; // 0.4s cooldown between shots
      }
    } else {
      if (this.state.laserCooldown > 0) {
        this.state.laserCooldown--;
      }
    }

    // Update lasers
    this.updateLasers();

    // Update power-ups
    this.updatePowerUps();

    // Update particles
    this.updateParticles();

    // Update screen shake
    if (this.state.screenShake.duration > 0) {
      this.state.screenShake.duration--;
    }

    // Update quest
    if (this.state.quest.active) {
      this.updateQuest();
    }

    // Check phase transitions
    this.checkPhaseTransitions();

    // Update level transition timer
    if (this.state.levelTransitionTimer > 0) {
      this.state.levelTransitionTimer--;
      if (this.state.levelTransitionTimer <= 0) {
        this.advanceLevel();
      }
    }
  }

  private updateBalls(): void {
    const magnetismActive = this.state.activeBuffs.some(b => b.type === 'Magnetism');

    for (const ball of this.state.balls) {
      if (this.state.timeWarpActive || ball.frozen) continue;

      // Sub-step movement to prevent ball tunneling through bricks or wedging into seams
      const speed = Math.hypot(ball.vx, ball.vy);
      const subSteps = Math.max(1, Math.ceil(speed / 3.5));
      const stepVx = ball.vx / subSteps;
      const stepVy = ball.vy / subSteps;

      // Apply magnetism force once per frame if active
      if (magnetismActive && ball.vy > 0) {
        const dx = this.state.paddle.x - ball.x;
        const dist = Math.abs(dx);
        if (dist < 200) {
          const force = (1 - dist / 200) * 0.3;
          ball.vx += (dx > 0 ? 1 : -1) * force;
        }
      }

      for (let step = 0; step < subSteps; step++) {
        ball.x += stepVx;
        ball.y += stepVy;

        // Wall collisions
        if (ballWallCollision(ball)) {
          gameAudio.playSfx('bounce');
        }

        // Paddle collision
        if (ballPaddleCollision(ball, this.state.paddle)) {
          this.state.paddle.squashScale = 0.7;
          this.spawnSparkParticles(ball.x, ball.y, '#FFFFFF', 6);
          this.state.combo = 0; // Reset combo on paddle hit
          gameAudio.playSfx('bounce');
        }

        // Brick collisions for this sub-step
        const result = ballBricksCollision(ball, this.state.bricks);
        if (result.collided) {
          let soundPlayed = false;

          for (const hit of result.hitBricks) {
            const brick = hit.brick;

            if (brick.type === 'indestructible') {
              this.spawnDebrisParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#888888', 3);
              if (!soundPlayed) {
                gameAudio.playSfx('bounce');
                soundPlayed = true;
              }
              continue;
            }

            // Handle quest target hit
            if (this.state.quest.active && this.questTargetBrick && brick.id === this.questTargetBrick.id) {
              this.state.quest.hitsCurrent++;
              if (this.state.quest.hitsCurrent >= this.state.quest.hitsRequired) {
                this.completeQuest();
              }
            }

            // Scoring & damage
            if (hit.destroyed) {
              this.handleBrickDestroyed(brick);
              soundPlayed = true;
            } else {
              // Multi-hit brick damaged
              this.state.score += Math.floor(SCORING.multiHitFirst * this.state.comboMultiplier);
              this.state.combo++;
              this.spawnDebrisParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 4);
              if (!soundPlayed) {
                gameAudio.playSfx('brickHit');
                soundPlayed = true;
              }
            }

            this.state.comboMultiplier = 1.0 + this.state.combo * SCORING.comboMultiplier;

            // Blast Radius explosion
            const blastActive = this.state.activeBuffs.some(b => b.type === 'BlastRadius');
            if (blastActive) {
              this.triggerBlastRadiusExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.id);
            }
          }
        }
      }

      // Update ball trail once per frame
      ball.trail.unshift({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) {
        ball.trail.pop();
      }
    }

    // Check out of bounds balls
    const outOfBoundsBalls = this.state.balls.filter(ballOutOfBounds);
    if (outOfBoundsBalls.length > 0) {
      const hasActiveBall = this.state.balls.some(b => !ballOutOfBounds(b));
      if (hasActiveBall) {
        // Just remove out of bounds balls, keep the remaining ones in play without losing a life
        this.state.balls = this.state.balls.filter(b => !ballOutOfBounds(b));
      } else {
        // All balls are out of bounds: lose a life or trigger shield for the first one
        this.handleBallLost(outOfBoundsBalls[0]);
        // Filter out any other remaining out of bounds balls
        this.state.balls = this.state.balls.filter(b => !ballOutOfBounds(b));
      }
    }
  }

  private handleBrickDestroyed(brick: Brick): void {
    const points = brick.type === 'normal'
      ? SCORING.normalBrick
      : SCORING.multiHitBreak;

    this.state.score += Math.floor(points * this.state.comboMultiplier);
    this.state.combo++;
    gameAudio.playSfx('brickBreak');

    // Remove brick
    this.state.bricks = this.state.bricks.filter(b => b.id !== brick.id);

    // Spawn particles
    this.spawnDebrisParticles(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      brick.color,
      PARTICLES.debrisCount
    );

    // Screen shake
    this.state.screenShake = {
      intensity: brick.type === 'multi3' ? SHAKE.multiHit : SHAKE.brickHit,
      duration: SHAKE.duration,
    };

    // Power-up drop
    const config = LEVEL_CONFIGS[this.state.level - 1];
    const dropChance = (config?.powerUpChance || POWERUP_DROP_CHANCE) * this.state.difficultyMultiplier;
    if (Math.random() < Math.min(dropChance, 0.3)) {
      this.spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
  }

  private handleBallLost(ball: Ball): void {
    // Check shield
    if (this.state.shieldActive) {
      this.state.shieldActive = false;
      ball.vy = -Math.abs(ball.vy);
      ball.y = CANVAS_HEIGHT - 50;
      this.spawnSparkParticles(ball.x, CANVAS_HEIGHT - 10, COLORS.shield, 10);
      gameAudio.playSfx('bounce');
      return;
    }

    this.state.lives--;
    this.state.combo = 0;
    this.state.comboMultiplier = 1.0;
    gameAudio.playSfx('lifeLost');

    // Screen shake
    this.state.screenShake = {
      intensity: SHAKE.lifeLost,
      duration: SHAKE.duration * 2,
    };

    // Spawn heart break particles
    this.spawnHeartBreakParticles(CANVAS_WIDTH - 40 - (this.state.lives * 30), 30);

    if (this.state.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Respawn ball
      const config = LEVEL_CONFIGS[this.state.level - 1];
      const rawSpeed = (config?.ballSpeed || BALL.baseSpeed) * this.state.difficultyMultiplier;
      const speedOffset = (this.state.level >= 6 && this.state.level <= 10) ? -0.3 : 0;
      this.state.balls = [createBall(this.state.paddle.x, PADDLE.y - 40, Math.min(rawSpeed + speedOffset, BALL.maxSpeed))];
    }

    this.emitStateChange();
  }

  private triggerGameOver(): void {
    this.state.screen = 'GAME_OVER';
    this.state.gameOverTimer = TRANSITIONS.gameOver;
    updateBestScore(this.state.score);
    saveGameProgress(this.state.level, this.state.score, this.state.lives);
    gameAudio.stopMusic();
    gameAudio.playSfx('gameOver');
    this.emitStateChange();
  }

  private updatePowerUps(): void {
    for (const pu of this.state.powerUps) {
      updatePowerUpPosition(pu);

      // Check collection
      if (powerUpPaddleCollision(pu, this.state.paddle)) {
        this.collectPowerUp(pu);
        pu.collected = true;
      }
    }

    // Remove collected/out of bounds
    this.state.powerUps = this.state.powerUps.filter(
      pu => !pu.collected && pu.y < CANVAS_HEIGHT + 30
    );
  }

  private collectPowerUp(pu: PowerUpEntity): void {
    this.state.score += SCORING.powerUpCollect;
    this.spawnSparkParticles(pu.x, pu.y, POWERUP.colors[pu.type], 8);
    gameAudio.playSfx('powerUp');

    switch (pu.type) {
      case 'HyperBounce':
        this.applyBuff('HyperBounce', POWERUP.buffDuration);
        this.state.balls.forEach(b => {
          b.speed = Math.min(b.speed * 1.5, BALL.maxSpeed);
          const normalized = this.normalizeBallVelocity(b);
          b.vx = normalized.vx;
          b.vy = normalized.vy;
        });
        break;
      case 'Magnetism':
        this.applyBuff('Magnetism', POWERUP.buffDuration);
        break;
      case 'AetherShield':
        this.state.shieldActive = true;
        this.applyBuff('AetherShield', -1); // No timer
        break;
      case 'TimeWarp':
        this.state.timeWarpActive = true;
        this.state.timeWarpTimer = 120; // 2 seconds at 60fps
        this.state.balls.forEach(b => b.frozen = true);
        this.applyBuff('TimeWarp', POWERUP.timeWarpDuration);
        break;
      case 'GrowPaddle':
        this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== 'ShrinkPaddle' && b.type !== 'ChaosZone');
        this.applyBuff('GrowPaddle', POWERUP.buffDuration);
        break;
      case 'ShrinkPaddle':
        this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== 'GrowPaddle' && b.type !== 'ChaosZone');
        this.applyBuff('ShrinkPaddle', POWERUP.buffDuration);
        break;
      case 'SpeedUpBall':
        this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== 'SlowDownBall');
        this.applyBuff('SpeedUpBall', POWERUP.buffDuration);
        break;
      case 'SlowDownBall':
        this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== 'SpeedUpBall' && b.type !== 'HyperBounce' && b.type !== 'ChaosZone');
        this.applyBuff('SlowDownBall', POWERUP.buffDuration);
        break;
      case 'ChaosZone':
        this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== 'GrowPaddle' && b.type !== 'ShrinkPaddle' && b.type !== 'SlowDownBall');
        this.applyBuff('ChaosZone', POWERUP.buffDuration);
        break;
      case 'BlastRadius':
        this.applyBuff('BlastRadius', POWERUP.buffDuration);
        break;
      case 'LaserPaddle':
        this.applyBuff('LaserPaddle', POWERUP.buffDuration);
        break;
      case 'Multiball':
        this.triggerMultiball();
        break;
    }

    this.emitStateChange();
  }

  private applyBuff(type: PowerUpType, duration: number): void {
    // Remove existing buff of same type
    this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== type);

    this.state.activeBuffs.push({
      type,
      duration: duration > 0 ? duration : 999999,
      maxDuration: duration > 0 ? duration : 999999,
      startTime: performance.now(),
    });
  }

  private updateBuffs(): void {
    const now = performance.now();
    this.state.activeBuffs = this.state.activeBuffs.filter(buff => {
      if (buff.type === 'AetherShield' && this.state.shieldActive) {
        return true; // Shield stays until used
      }
      const elapsed = now - buff.startTime;
      return elapsed < buff.duration;
    });

    // Remove shield buff if shield is gone
    if (!this.state.shieldActive) {
      this.state.activeBuffs = this.state.activeBuffs.filter(b => b.type !== 'AetherShield');
    }
  }

  private updateParticles(): void {
    for (const p of this.state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += PARTICLES.gravity;
      p.life--;
    }
    this.state.particles = this.state.particles.filter(p => p.life > 0);

    for (const s of this.state.starParticles) {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.05;
      s.rotation += s.rotationSpeed;
      s.life--;
    }
    this.state.starParticles = this.state.starParticles.filter(s => s.life > 0);
  }

  private updateQuest(): void {
    if (!this.state.quest.active) return;

    // Update timer
    if (this.state.quest.timer > 0) {
      this.state.quest.timer--;
      if (this.state.quest.timer <= 0 && !this.state.quest.completed) {
        this.failQuest();
      }
    }
  }

  private checkPhaseTransitions(): void {
    // Check if all breakable bricks destroyed
    if (this.state.phase === 'PHASE_A') {
      const breakableBricks = this.state.bricks.filter(b => b.type !== 'indestructible');
      if (breakableBricks.length === 0) {
        // All bricks cleared - trigger level complete directly!
        this.triggerLevelComplete();
      }
    }
  }

  private triggerLevelComplete(): void {
    if (this.state.levelTransitionTimer > 0) return;

    this.state.score += SCORING.levelComplete;
    this.state.levelTransitionTimer = TRANSITIONS.levelComplete;

    // Clear balls and lasers to look clean during transition
    this.state.balls = [];
    this.state.lasers = [];
    this.state.powerUps = [];

    gameAudio.stopMusic();
    gameAudio.playSfx('victory');

    this.emitStateChange();
  }





  private completeQuest(): void {
    this.state.quest.completed = true;
    this.state.quest.active = false;
    this.state.score += SCORING.questComplete;

    // Give bonus power-up reward
    this.spawnPowerUp(CANVAS_WIDTH / 2, PLAY_AREA_TOP + 50);

    // Transition to next level
    this.state.levelTransitionTimer = TRANSITIONS.levelComplete;
    gameAudio.stopMusic();
    gameAudio.playSfx('victory');
    this.emitStateChange();
  }

  private failQuest(): void {
    this.state.quest.failed = true;
    this.state.quest.active = false;
    this.state.screenShake = { intensity: SHAKE.questFail, duration: SHAKE.duration };
    gameAudio.playSfx('lifeLost');

    // Still advance but no bonus
    this.state.levelTransitionTimer = TRANSITIONS.levelComplete;
    this.emitStateChange();
  }

  private advanceLevel(): void {
    const nextLevel = this.state.level + 1;

    if (nextLevel > LEVEL_CONFIGS.length) {
      // Game complete!
      this.state.screen = 'VICTORY';
      updateBestScore(this.state.score);
      updateUnlockedLevel(LEVEL_CONFIGS.length);
      gameAudio.stopMusic();
      gameAudio.playSfx('victory');
      this.emitStateChange();
      return;
    }

    updateUnlockedLevel(nextLevel);
    this.loadLevel(nextLevel);
    saveGameProgress(nextLevel, this.state.score, this.state.lives);
    this.emitStateChange();
  }

  nextLevel(): void {
    this.advanceLevel();
  }

  restartLevel(): void {
    // Reset score to what it was when this level started
    this.state.score = this.levelStartScore;
    this.loadLevel(this.state.level);
    this.state.screen = 'PLAYING';
    this.emitStateChange();
  }

  // ==================== SPAWNING ====================

  private spawnPowerUp(x: number, y: number): void {
    // Distribute probabilities (ExtraLife removed — lives are milestone-based now):
    // ChaosZone  ->  4%
    // TimeWarp   ->  7%
    // BlastRadius -> 10%
    // LaserPaddle -> 13%
    // Multiball   -> 13%
    // Others      -> equal split (53% total)
    const rand = Math.random();
    let type: PowerUpType;
    if (rand < 0.04) {
      type = 'ChaosZone';
    } else if (rand < 0.11) {
      type = 'TimeWarp';
    } else if (rand < 0.21) {
      type = 'BlastRadius';
    } else if (rand < 0.34) {
      type = 'LaserPaddle';
    } else if (rand < 0.47) {
      type = 'Multiball';
    } else {
      const standardTypes: PowerUpType[] = [
        'HyperBounce', 'Magnetism', 'AetherShield',
        'GrowPaddle', 'ShrinkPaddle', 'SpeedUpBall', 'SlowDownBall'
      ];
      type = standardTypes[Math.floor(Math.random() * standardTypes.length)];
    }

    this.state.powerUps.push({
      id: `pu_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: POWERUP.radius,
      type,
      vy: POWERUP.fallSpeed,
      vyOscillation: Math.random() * Math.PI * 2,
      collected: false,
    });
  }

  private spawnDebrisParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: PARTICLES.debrisLife + Math.random() * 10,
        maxLife: PARTICLES.debrisLife + 10,
        color,
        size: 3 + Math.random() * 4,
        type: 'debris',
      });
    }
  }

  private spawnSparkParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: PARTICLES.sparkLife,
        maxLife: PARTICLES.sparkLife,
        color,
        size: 2 + Math.random() * 2,
        type: 'spark',
      });
    }
  }

  private spawnHeartBreakParticles(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const speed = 1 + Math.random() * 2;
      this.state.starParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 40,
        maxLife: 40,
        size: 6 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  // ==================== RENDERING ====================

  private render(): void {
    const ctx = this.ctx;
    ctx.save();

    // Apply screen shake
    if (this.state.screenShake.duration > 0) {
      const intensity = this.state.screenShake.intensity * (this.state.screenShake.duration / SHAKE.duration);
      const dx = (Math.random() - 0.5) * intensity * 2;
      const dy = (Math.random() - 0.5) * intensity * 2;
      ctx.translate(dx, dy);
    }

    // Background
    this.renderBackground(ctx);

    // Time warp filter
    if (this.state.timeWarpActive) {
      ctx.save();
      ctx.filter = 'invert(1) hue-rotate(180deg)';
    }

    // Bricks
    this.renderBricks(ctx);

    // Power-ups
    this.renderPowerUps(ctx);

    // Lasers
    this.renderLasers(ctx);

    // Paddle
    this.renderPaddle(ctx);

    // Balls
    this.renderBalls(ctx);

    // Particles
    this.renderParticles(ctx);

    // Shield line
    if (this.state.shieldActive) {
      this.renderShield(ctx);
    }

    // Time warp filter restore
    if (this.state.timeWarpActive) {
      ctx.restore();
    }

    // HUD
    this.renderHUD(ctx);

    // Quest overlay
    if (this.state.quest.active) {
      this.renderQuestOverlay(ctx);
    }

    // Phase transition
    if (this.state.levelTransitionTimer > 0) {
      this.renderTransition(ctx);
    }

    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    // Solid background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Pattern image if loaded
    if (this.bgImage) {
      ctx.globalAlpha = 0.15;
      ctx.drawImage(this.bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }

    // Play area border
    ctx.strokeStyle = 'rgba(90, 24, 154, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, PLAY_AREA_TOP, CANVAS_WIDTH - 2, PLAY_AREA_HEIGHT - 1);
  }

  private renderBricks(ctx: CanvasRenderingContext2D): void {
    for (const brick of this.state.bricks) {
      ctx.save();

      // Flash effect
      if (brick.flashTimer > 0) {
        brick.flashTimer--;
        ctx.fillStyle = '#FFFFFF';
      } else {
        // Degrade color based on HP for multi-hit bricks
        if (brick.type === 'multi3' && brick.hp === 2) {
          ctx.fillStyle = this.lightenColor(brick.color, 30);
        } else if (brick.type === 'multi3' && brick.hp === 1) {
          ctx.fillStyle = this.lightenColor(brick.color, 60);
        } else if (brick.type === 'multi2' && brick.hp === 1) {
          ctx.fillStyle = this.lightenColor(brick.color, 40);
        } else if (brick.type === 'indestructible') {
          ctx.fillStyle = '#6C757D';
        } else {
          ctx.fillStyle = brick.color;
        }
      }

      const radius = 4;
      const x = brick.x;
      const y = brick.y;
      const w = brick.width;
      const h = brick.height;

      // Draw rounded rect
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // Inner highlight for depth
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // HP indicator for multi-hit bricks
      if (brick.maxHp > 1 && brick.type !== 'indestructible') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${brick.hp}`, x + w / 2, y + h / 2);
      }

      // Indestructible marker
      if (brick.type === 'indestructible') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('X', x + w / 2, y + h / 2);
      }

      ctx.restore();
    }
  }

  private renderPaddle(ctx: CanvasRenderingContext2D): void {
    const p = this.state.paddle;
    ctx.save();

    const x = p.x - p.width / 2;
    const y = p.y - p.height / 2;

    // Squash and stretch
    const scaleX = 1 + (1 - p.squashScale) * 0.3;
    const scaleY = p.squashScale;

    ctx.translate(p.x, p.y);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-p.x, -p.y);

    // Glow
    ctx.shadowColor = COLORS.paddleAccent;
    ctx.shadowBlur = 15;

    // Main paddle body
    const radius = 9;
    ctx.fillStyle = COLORS.paddleBase;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + p.width - radius, y);
    ctx.quadraticCurveTo(x + p.width, y, x + p.width, y + radius);
    ctx.lineTo(x + p.width, y + p.height - radius);
    ctx.quadraticCurveTo(x + p.width, y + p.height, x + p.width - radius, y + p.height);
    ctx.lineTo(x + radius, y + p.height);
    ctx.quadraticCurveTo(x, y + p.height, x, y + p.height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Inner accent line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = COLORS.paddleAccent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center indicator
    ctx.fillStyle = COLORS.paddleAccent;
    ctx.fillRect(p.x - 2, y + 3, 4, p.height - 6);

    ctx.restore();
  }

  private renderBalls(ctx: CanvasRenderingContext2D): void {
    const hyperActive = this.state.activeBuffs.some(b => b.type === 'HyperBounce');

    for (const ball of this.state.balls) {
      // Trail
      for (let i = ball.trail.length - 1; i >= 0; i--) {
        const t = ball.trail[i];
        const alpha = (1 - i / ball.trail.length) * 0.45;
        const size = ball.radius * (1 - i / ball.trail.length) * 0.85;

        ctx.beginPath();
        ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
        // Purple trail normally, orange trail for hyperactive
        ctx.fillStyle = hyperActive 
          ? `rgba(255, 158, 0, ${alpha})` 
          : `rgba(90, 24, 154, ${alpha})`;
        ctx.fill();
      }

      // Main ball
      ctx.save();
      
      // Glow: Purple normally, Orange for HyperBounce
      ctx.shadowColor = hyperActive ? POWERUP.colors.HyperBounce : COLORS.primary;
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = hyperActive ? POWERUP.colors.HyperBounce : COLORS.ball;
      ctx.fill();

      // High contrast edge stroke to prevent background blend
      ctx.shadowBlur = 0; // disable shadow for stroke
      ctx.strokeStyle = COLORS.paddleBase; // very dark purple
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderPowerUps(ctx: CanvasRenderingContext2D): void {
    for (const pu of this.state.powerUps) {
      if (pu.collected) continue;

      ctx.save();

      // Glow
      ctx.shadowColor = POWERUP.colors[pu.type] || '#FFFFFF';
      ctx.shadowBlur = 12;

      // Draw image if loaded (new ones won't have it)
      const img = this.powerUpImages.get(pu.type);
      if (img && img.src && img.complete && img.naturalWidth > 0) {
        const size = pu.radius * 2.5;
        ctx.drawImage(img, pu.x - size / 2, pu.y - size / 2, size, size);
      } else {
        // Fallback: styled glowing circle with intuitive symbol inside
        ctx.beginPath();
        ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
        ctx.fillStyle = POWERUP.colors[pu.type] || '#FFFFFF';
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#10002B';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let symbol = '';
        if (pu.type === 'GrowPaddle') symbol = '↔';
        else if (pu.type === 'ShrinkPaddle') symbol = '→←';
        else if (pu.type === 'SpeedUpBall') symbol = '⚡';
        else if (pu.type === 'SlowDownBall') symbol = '⏳';
        else if (pu.type === 'ChaosZone') symbol = '☠';
        else if (pu.type === 'BlastRadius') symbol = '💥';
        else if (pu.type === 'LaserPaddle') symbol = '🔫';
        else if (pu.type === 'Multiball') symbol = '⚪⚪';
        else if (pu.type === 'ExtraLife') symbol = '❤️';
        else symbol = '?';
        
        ctx.fillText(symbol, pu.x, pu.y);
      }

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    // Regular particles
    for (const p of this.state.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }

    // Star particles
    for (const s of this.state.starParticles) {
      const alpha = s.life / s.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);
      ctx.fillStyle = COLORS.heartFull;

      // Draw star shape
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const outerX = Math.cos(angle) * s.size;
        const outerY = Math.sin(angle) * s.size;
        const innerAngle = angle + Math.PI / 5;
        const innerX = Math.cos(innerAngle) * s.size * 0.4;
        const innerY = Math.sin(innerAngle) * s.size * 0.4;

        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private renderLasers(ctx: CanvasRenderingContext2D): void {
    for (const laser of this.state.lasers) {
      ctx.save();
      ctx.fillStyle = POWERUP.colors.LaserPaddle;
      ctx.shadowColor = POWERUP.colors.LaserPaddle;
      ctx.shadowBlur = 8;
      
      // Draw a glowing laser capsule
      ctx.beginPath();
      const radius = laser.width / 2;
      ctx.arc(laser.x + radius, laser.y + radius, radius, Math.PI, 0);
      ctx.lineTo(laser.x + laser.width, laser.y + laser.height - radius);
      ctx.arc(laser.x + radius, laser.y + laser.height - radius, radius, 0, Math.PI);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  private renderShield(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = COLORS.shield;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.shield;
    ctx.shadowBlur = 10;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(10, CANVAS_HEIGHT - 5);
    ctx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 5);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    // HUD Background
    ctx.fillStyle = 'rgba(90, 24, 154, 0.08)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    // Score
    ctx.fillStyle = COLORS.uiTextPrimary;
    ctx.font = "bold 22px 'Fredoka One', 'Nunito', sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`SCORE: ${this.state.score.toLocaleString()}`, 20, 15);

    // Combo
    if (this.state.combo > 1) {
      ctx.fillStyle = COLORS.accent;
      ctx.font = "bold 16px 'Nunito', sans-serif";
      ctx.fillText(`COMBO x${this.state.combo}`, 20, 45);
    }

    // Level
    ctx.fillStyle = COLORS.uiTextPrimary;
    ctx.font = "bold 18px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${this.state.level} / ${this.state.totalLevels}`, CANVAS_WIDTH / 2, 18);

    // Level name
    const config = LEVEL_CONFIGS[this.state.level - 1];
    if (config) {
      ctx.fillStyle = COLORS.uiTextSecondary;
      ctx.font = "14px 'Nunito', sans-serif";
      ctx.fillText(config.name, CANVAS_WIDTH / 2, 42);
    }

    // Phase indicator
    if (this.state.phase === 'PHASE_B') {
      ctx.fillStyle = COLORS.accent;
      ctx.font = "bold 14px 'Nunito', sans-serif";
      ctx.fillText('QUEST ACTIVE', CANVAS_WIDTH / 2, 65);
    }

    // Lives (hearts)
    ctx.textAlign = 'right';
    for (let i = 0; i < this.state.maxLives; i++) {
      const x = CANVAS_WIDTH - 30 - i * 32;
      const y = 20;
      if (i < this.state.lives) {
        this.drawHeart(ctx, x, y, 12, COLORS.heartFull);
      } else {
        this.drawHeart(ctx, x, y, 12, COLORS.heartEmpty);
      }
    }

    // Active buffs
    let buffX = CANVAS_WIDTH - 20;
    for (const buff of this.state.activeBuffs) {
      const remaining = buff.duration - (performance.now() - buff.startTime);
      const progress = Math.max(0, remaining / buff.maxDuration);

      // Buff icon
      ctx.save();
      ctx.fillStyle = POWERUP.colors[buff.type];
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(buffX - 15, 72, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Progress ring
      ctx.save();
      ctx.strokeStyle = POWERUP.colors[buff.type];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(buffX - 15, 72, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
      ctx.restore();

      buffX -= 36;
    }

    // Difficulty multiplier
    ctx.fillStyle = COLORS.uiTextSecondary;
    ctx.font = "12px 'Nunito', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText(`DM: ${this.state.difficultyMultiplier.toFixed(1)}x`, 20, 72);
  }

  private renderQuestOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.state.quest.active) return;

    const q = this.state.quest;

    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(60, 9, 108, 0.3)';
    ctx.fillRect(0, PLAY_AREA_TOP, CANVAS_WIDTH, PLAY_AREA_HEIGHT);

    // Quest panel background
    const panelW = 400;
    const panelH = 100;
    const panelX = (CANVAS_WIDTH - panelW) / 2;
    const panelY = PLAY_AREA_TOP + 20;

    ctx.fillStyle = 'rgba(90, 24, 154, 0.9)';
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = COLORS.accent;
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.stroke();

    // Quest title
    ctx.fillStyle = COLORS.accent;
    ctx.font = "bold 18px 'Nunito', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SECONDARY QUEST', CANVAS_WIDTH / 2, panelY + 12);

    // Description
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "14px 'Nunito', sans-serif";
    ctx.fillText(q.description, CANVAS_WIDTH / 2, panelY + 40);

    // Timer bar
    const barW = 300;
    const barH = 8;
    const barX = (CANVAS_WIDTH - barW) / 2;
    const barY = panelY + 68;
    const progress = q.timer / q.maxTimer;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.drawRoundedRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    ctx.fillStyle = progress < 0.3 ? '#FF4D6D' : COLORS.accent;
    this.drawRoundedRect(ctx, barX, barY, barW * progress, barH, 4);
    ctx.fill();

    // Timer text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "12px 'Nunito', sans-serif";
    ctx.fillText(`${Math.ceil(q.timer / 60)}s`, CANVAS_WIDTH / 2, barY + 14);



    // Stabilization target indicator
    if (q.type === 'Stabilization' && this.questTargetBrick) {
      const tb = this.questTargetBrick;
      ctx.strokeStyle = COLORS.accent;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(tb.x - 4, tb.y - 4, tb.width + 8, tb.height + 8);
      ctx.setLineDash([]);

      // Hits counter
      ctx.fillStyle = '#FFFFFF';
      ctx.font = "bold 20px 'Nunito', sans-serif";
      ctx.fillText(`${q.hitsCurrent} / ${q.hitsRequired}`, tb.x + tb.width / 2, tb.y - 15);
    }
  }

  private renderTransition(ctx: CanvasRenderingContext2D): void {
    const alpha = this.state.levelTransitionTimer / TRANSITIONS.levelComplete;

    ctx.fillStyle = `rgba(90, 24, 154, ${0.7 * (1 - alpha)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = `rgba(255, 255, 255, ${1 - alpha})`;
    ctx.font = "bold 36px 'Fredoka One', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = "20px 'Nunito', sans-serif";
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`+${SCORING.levelComplete} PTS`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  // ==================== UTILITY ====================

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.3, -size, size * 0.1, 0, size);
    ctx.bezierCurveTo(size, size * 0.1, size * 0.5, -size * 0.3, 0, size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0x00FF) + amount);
    const b = Math.min(255, (num & 0x0000FF) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private normalizeBallVelocity(ball: Ball): { vx: number; vy: number } {
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed === 0) return { vx: 0, vy: -ball.speed };
    return {
      vx: (ball.vx / speed) * ball.speed,
      vy: (ball.vy / speed) * ball.speed,
    };
  }

  private triggerBlastRadiusExplosion(centerX: number, centerY: number, sourceBrickId: string): void {
    // Spawn nice big explosion particles
    this.spawnSparkParticles(centerX, centerY, '#FF5E00', 15);
    this.spawnSparkParticles(centerX, centerY, '#FFBE0B', 10);
    this.state.screenShake = { intensity: 8, duration: 15 };

    // Damage all nearby bricks (excluding indestructible ones, and the source brick)
    const blastRange = 120; // range in pixels
    const bricksToDamage: Brick[] = [];

    for (const brick of this.state.bricks) {
      if (brick.id === sourceBrickId || brick.type === 'indestructible') continue;
      
      const brickCenterX = brick.x + brick.width / 2;
      const brickCenterY = brick.y + brick.height / 2;
      const dist = Math.sqrt((brickCenterX - centerX) ** 2 + (brickCenterY - centerY) ** 2);
      
      if (dist <= blastRange) {
        bricksToDamage.push(brick);
      }
    }

    // Apply 1 damage to each brick in range
    for (const brick of bricksToDamage) {
      brick.hp -= 1;
      brick.flashTimer = 6;
      if (brick.hp <= 0) {
        this.handleBrickDestroyed(brick);
      } else {
        this.state.score += Math.floor(SCORING.multiHitFirst * this.state.comboMultiplier);
        this.state.combo++;
        this.spawnDebrisParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 4);
      }
    }
  }

  private shootLasers(): void {
    const p = this.state.paddle;
    const leftX = p.x - p.width / 2 + 10;
    const rightX = p.x + p.width / 2 - 10;
    const y = p.y - 10;

    const leftLaser: LaserBeam = {
      id: `laser_${Date.now()}_${Math.random()}`,
      x: leftX,
      y,
      vy: -10, // speed going up
      width: 4,
      height: 15,
    };

    const rightLaser: LaserBeam = {
      id: `laser_${Date.now()}_${Math.random()}`,
      x: rightX,
      y,
      vy: -10,
      width: 4,
      height: 15,
    };

    this.state.lasers.push(leftLaser, rightLaser);
    this.spawnSparkParticles(leftX, y, POWERUP.colors.LaserPaddle, 3);
    this.spawnSparkParticles(rightX, y, POWERUP.colors.LaserPaddle, 3);
    gameAudio.playSfx('laser');
  }

  private updateLasers(): void {
    for (const laser of this.state.lasers) {
      laser.y += laser.vy;

      // Check collision with bricks
      let hit = false;
      for (const brick of this.state.bricks) {
        // AABB check
        if (
          laser.x < brick.x + brick.width &&
          laser.x + laser.width > brick.x &&
          laser.y < brick.y + brick.height &&
          laser.y + laser.height > brick.y
        ) {
          hit = true;
          // Damage brick
          if (brick.type !== 'indestructible') {
            brick.hp -= 1;
            brick.flashTimer = 6;
            
            // Blast Radius interaction
            const blastActive = this.state.activeBuffs.some(b => b.type === 'BlastRadius');
            if (blastActive) {
              this.triggerBlastRadiusExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.id);
            }

            if (brick.hp <= 0) {
              this.handleBrickDestroyed(brick);
            } else {
              this.state.score += Math.floor(SCORING.multiHitFirst * this.state.comboMultiplier);
              this.state.combo++;
              this.spawnDebrisParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 3);
            }
          } else {
            // Indestructible flash
            brick.flashTimer = 6;
            this.spawnDebrisParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#888888', 2);
          }
          break; // Stop checking this laser beam since it hit
        }
      }

      if (hit) {
        laser.y = -100; // Flag for removal
      }
    }

    // Filter out offscreen or hit lasers
    this.state.lasers = this.state.lasers.filter(l => l.y > PLAY_AREA_TOP);
  }

  private triggerMultiball(): void {
    const newBalls: Ball[] = [];
    
    // If no balls are active, spawn a default ball first
    if (this.state.balls.length === 0) {
      const config = LEVEL_CONFIGS[this.state.level - 1];
      const ballSpeed = (config?.ballSpeed || BALL.baseSpeed) * this.state.difficultyMultiplier;
      this.state.balls.push(createBall(this.state.paddle.x, PADDLE.y - 40, Math.min(ballSpeed, BALL.maxSpeed)));
    }

    for (const ball of this.state.balls) {
      // Spawn two new balls at the same position, but with different angles
      const currentSpeed = ball.speed;
      const currentAngle = Math.atan2(ball.vy, ball.vx);

      // Create ball 1: currentAngle - 15 degrees
      const angle1 = currentAngle - Math.PI / 12;
      const ball1: Ball = {
        x: ball.x,
        y: ball.y,
        radius: ball.radius,
        vx: Math.cos(angle1) * currentSpeed,
        vy: Math.sin(angle1) * currentSpeed,
        speed: currentSpeed,
        baseSpeed: ball.baseSpeed,
        trail: [],
        frozen: ball.frozen,
      };

      // Create ball 2: currentAngle + 15 degrees
      const angle2 = currentAngle + Math.PI / 12;
      const ball2: Ball = {
        x: ball.x,
        y: ball.y,
        radius: ball.radius,
        vx: Math.cos(angle2) * currentSpeed,
        vy: Math.sin(angle2) * currentSpeed,
        speed: currentSpeed,
        baseSpeed: ball.baseSpeed,
        trail: [],
        frozen: ball.frozen,
      };

      newBalls.push(ball1, ball2);
    }
    
    // Add to state balls
    this.state.balls.push(...newBalls);
    
    // Limit to max 12 balls to prevent infinite performance lag
    if (this.state.balls.length > 12) {
      this.state.balls = this.state.balls.slice(0, 12);
    }
  }

  // ==================== PUBLIC GETTERS ====================

  getState(): GameState {
    return this.state;
  }

  isPaused(): boolean {
    return this.state.isPaused;
  }

  getCurrentScreen(): GameScreen {
    return this.state.screen;
  }
}
