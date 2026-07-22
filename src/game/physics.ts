// ============================================================
// AetherPaddle II - Physics Engine & Collision Detection
// ============================================================

import type { Ball, Brick, Paddle, PowerUpEntity, Vec2 } from './types';
import { CANVAS_WIDTH, PLAY_AREA_TOP, CANVAS_HEIGHT, PADDLE, BALL } from './constants';

// AABB Collision check between two rectangles
export function rectRectCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// Circle-rectangle collision (for ball vs brick/paddle)
export function circleRectCollision(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number
): { collided: boolean; nx: number; ny: number } {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - closestX;
  const dy = cy - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < cr) {
    // Calculate collision normal
    if (distance === 0) {
      // Circle center is inside rectangle - push out
      const overlapLeft = cx - rx;
      const overlapRight = (rx + rw) - cx;
      const overlapTop = cy - ry;
      const overlapBottom = (ry + rh) - cy;
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
      
      if (minOverlap === overlapLeft) return { collided: true, nx: -1, ny: 0 };
      if (minOverlap === overlapRight) return { collided: true, nx: 1, ny: 0 };
      if (minOverlap === overlapTop) return { collided: true, nx: 0, ny: -1 };
      return { collided: true, nx: 0, ny: 1 };
    }
    
    return { collided: true, nx: dx / distance, ny: dy / distance };
  }

  return { collided: false, nx: 0, ny: 0 };
}

// Ball vs Paddle collision with angle control
export function ballPaddleCollision(
  ball: Ball,
  paddle: Paddle
): boolean {
  const collision = circleRectCollision(
    ball.x, ball.y, ball.radius,
    paddle.x - paddle.width / 2, paddle.y - paddle.height / 2,
    paddle.width, paddle.height
  );

  if (!collision.collided) return false;

  // Only bounce if ball is moving downward
  if (ball.vy < 0) return false;

  // Calculate angle bias from hit position (-1 to 1)
  const hitPos = (ball.x - paddle.x) / (paddle.width / 2);

  // Blend: keep 60% of existing vx direction + add 40% from hit position bias
  // This avoids runaway vx accumulation from repeated edge hits
  const biasVx = hitPos * ball.speed * 0.6;
  ball.vx = ball.vx * 0.4 + biasVx;

  // Clamp vx so the ball always has a meaningful vertical component (max 70% of speed as vx)
  const maxVx = ball.speed * 0.70;
  ball.vx = Math.max(-maxVx, Math.min(maxVx, ball.vx));

  // Normalize velocity to maintain speed
  const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  if (currentSpeed > 0) {
    ball.vx = (ball.vx / currentSpeed) * ball.speed;
    ball.vy = (ball.vy / currentSpeed) * ball.speed;
  }

  // Enforce minimum vertical speed to prevent horizontal infinite loops
  const minVy = ball.speed * 0.30;
  if (Math.abs(ball.vy) < minVy) {
    ball.vy = -minVy;
    // Re-normalise keeping direction of vx
    const s2 = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    ball.vx = (ball.vx / s2) * ball.speed;
    ball.vy = (ball.vy / s2) * ball.speed;
  }

  // Always bounce upward
  ball.vy = -Math.abs(ball.vy);

  // Ensure ball is above paddle to prevent sticking
  ball.y = paddle.y - paddle.height / 2 - ball.radius - 2;

  return true;
}

export interface BrickHitInfo {
  brick: Brick;
  destroyed: boolean;
}

export interface BallBricksCollisionResult {
  collided: boolean;
  hitBricks: BrickHitInfo[];
  hasIndestructible: boolean;
}

// Ball vs Bricks multi-collision detection (seam-safe and tunneling-proof)
export function ballBricksCollision(
  ball: Ball,
  bricks: Brick[]
): BallBricksCollisionResult {
  const overlapping: { brick: Brick; overlapX: number; overlapY: number; diffX: number; diffY: number }[] = [];

  for (const brick of bricks) {
    const halfBW = brick.width / 2;
    const halfBH = brick.height / 2;
    const brickCenterX = brick.x + halfBW;
    const brickCenterY = brick.y + halfBH;

    const diffX = ball.x - brickCenterX;
    const diffY = ball.y - brickCenterY;

    const overlapX = (ball.radius + halfBW) - Math.abs(diffX);
    const overlapY = (ball.radius + halfBH) - Math.abs(diffY);

    if (overlapX > 0 && overlapY > 0) {
      overlapping.push({
        brick,
        overlapX,
        overlapY,
        diffX,
        diffY,
      });
    }
  }

  if (overlapping.length === 0) {
    return { collided: false, hitBricks: [], hasIndestructible: false };
  }

  // Find minimum overlaps to determine primary collision plane
  let minOverlapX = Infinity;
  let minOverlapY = Infinity;

  for (const item of overlapping) {
    if (item.overlapX < minOverlapX) minOverlapX = item.overlapX;
    if (item.overlapY < minOverlapY) minOverlapY = item.overlapY;
  }

  // Vertical collision (top or bottom edge) if Y overlap is smaller than X overlap
  const isVerticalHit = minOverlapY <= minOverlapX;

  if (isVerticalHit) {
    // Reflect vertical velocity
    ball.vy = ball.vy > 0 ? -Math.abs(ball.vy) : Math.abs(ball.vy);

    // Push ball outside vertically (no horizontal displacement to prevent wedging into adjacent bricks)
    if (ball.vy < 0) {
      const topY = Math.min(...overlapping.map(o => o.brick.y));
      ball.y = topY - ball.radius - 1;
    } else {
      const bottomY = Math.max(...overlapping.map(o => o.brick.y + o.brick.height));
      ball.y = bottomY + ball.radius + 1;
    }
  } else {
    // Reflect horizontal velocity
    ball.vx = ball.vx > 0 ? -Math.abs(ball.vx) : Math.abs(ball.vx);

    // Push ball outside horizontally
    if (ball.vx < 0) {
      const leftX = Math.min(...overlapping.map(o => o.brick.x));
      ball.x = leftX - ball.radius - 1;
    } else {
      const rightX = Math.max(...overlapping.map(o => o.brick.x + o.brick.width));
      ball.x = rightX + ball.radius + 1;
    }
  }

  // Damage & flash timer for all hit bricks
  const hitBricks: BrickHitInfo[] = [];
  let hasIndestructible = false;

  for (const item of overlapping) {
    const brick = item.brick;
    brick.flashTimer = 6;

    if (brick.type === 'indestructible') {
      hasIndestructible = true;
      hitBricks.push({ brick, destroyed: false });
    } else {
      brick.hp -= 1;
      const destroyed = brick.hp <= 0;
      hitBricks.push({ brick, destroyed });
    }
  }

  return { collided: true, hitBricks, hasIndestructible };
}

// Single-brick fallback helper
export function ballBrickCollision(
  ball: Ball,
  brick: Brick
): { collided: boolean; destroyed: boolean; fromSide: boolean } {
  const result = ballBricksCollision(ball, [brick]);
  if (!result.collided || result.hitBricks.length === 0) {
    return { collided: false, destroyed: false, fromSide: false };
  }
  const hit = result.hitBricks[0];
  return { collided: true, destroyed: hit.destroyed, fromSide: false };
}

// Ball vs Wall collision
export function ballWallCollision(ball: Ball): boolean {
  let collided = false;

  // Left wall
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius + 1;
    ball.vx = Math.abs(ball.vx);
    collided = true;
  }

  // Right wall
  if (ball.x + ball.radius > CANVAS_WIDTH) {
    ball.x = CANVAS_WIDTH - ball.radius - 1;
    ball.vx = -Math.abs(ball.vx);
    collided = true;
  }

  // Top wall
  if (ball.y - ball.radius < PLAY_AREA_TOP) {
    ball.y = PLAY_AREA_TOP + ball.radius + 1;
    ball.vy = Math.abs(ball.vy);
    collided = true;
  }

  // Enforce minimum vertical speed after any wall bounce to prevent
  // horizontal infinite loops where the ball never reaches bricks or paddle.
  if (collided) {
    const minVy = ball.speed * 0.20;
    if (Math.abs(ball.vy) < minVy) {
      ball.vy = ball.vy >= 0 ? minVy : -minVy;
      // Re-normalise to preserve speed
      const s = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (s > 0) {
        ball.vx = (ball.vx / s) * ball.speed;
        ball.vy = (ball.vy / s) * ball.speed;
      }
    }
  }

  return collided;
}

// Check if ball fell below play area
export function ballOutOfBounds(ball: Ball): boolean {
  return ball.y - ball.radius > CANVAS_HEIGHT + 20;
}

// PowerUp vs Paddle collision
export function powerUpPaddleCollision(
  powerUp: PowerUpEntity,
  paddle: Paddle
): boolean {
  return rectRectCollision(
    powerUp.x - powerUp.radius, powerUp.y - powerUp.radius,
    powerUp.radius * 2, powerUp.radius * 2,
    paddle.x - paddle.width / 2, paddle.y - paddle.height / 2,
    paddle.width, paddle.height
  );
}

// Update ball position with magnetism effect
export function updateBallPosition(
  ball: Ball,
  paddleX: number,
  magnetismActive: boolean,
  timeWarpActive: boolean
): void {
  if (timeWarpActive || ball.frozen) return;

  // Apply magnetism if active
  if (magnetismActive && ball.vy > 0) {
    const dx = paddleX - ball.x;
    const dist = Math.abs(dx);
    if (dist < 200) {
      const force = (1 - dist / 200) * 0.3;
      ball.vx += (dx > 0 ? 1 : -1) * force;
    }
  }

  // Update position
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Update trail
  ball.trail.unshift({ x: ball.x, y: ball.y });
  if (ball.trail.length > 8) {
    ball.trail.pop();
  }
}

// Update paddle position (smooth follow)
export function updatePaddlePosition(paddle: Paddle, targetX: number, isTouch: boolean = false): void {
  paddle.targetX = targetX;
  const dx = paddle.targetX - paddle.x;
  // Touch relative drag gets 0.95 lerp speed for ultra-responsive movement
  const lerpSpeed = isTouch ? 0.95 : PADDLE.speed;
  paddle.x += dx * lerpSpeed;

  // Clamp to canvas bounds
  const halfWidth = paddle.width / 2;
  paddle.x = Math.max(halfWidth, Math.min(CANVAS_WIDTH - halfWidth, paddle.x));

  // Decay squash
  if (paddle.squashScale !== 1) {
    paddle.squashScale += (1 - paddle.squashScale) * 0.2;
    if (Math.abs(paddle.squashScale - 1) < 0.01) {
      paddle.squashScale = 1;
    }
  }
}

// Update power-up position
export function updatePowerUpPosition(powerUp: PowerUpEntity): void {
  powerUp.y += powerUp.vy;
  powerUp.vyOscillation += 0.05;
  powerUp.x += Math.sin(powerUp.vyOscillation) * 0.5;
}

// Calculate reflection vector
export function reflectVector(vx: number, vy: number, nx: number, ny: number): Vec2 {
  const dot = vx * nx + vy * ny;
  return {
    x: vx - 2 * dot * nx,
    y: vy - 2 * dot * ny,
  };
}

// Normalize a vector
export function normalizeVector(vx: number, vy: number, targetSpeed: number): Vec2 {
  const currentSpeed = Math.sqrt(vx * vx + vy * vy);
  if (currentSpeed === 0) return { x: 0, y: -targetSpeed };
  return {
    x: (vx / currentSpeed) * targetSpeed,
    y: (vy / currentSpeed) * targetSpeed,
  };
}

// Create a ball with initial velocity
export function createBall(x: number, y: number, speed: number): Ball {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Upward with slight random angle
  return {
    x,
    y,
    radius: BALL.radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    baseSpeed: speed,
    trail: [],
    frozen: false,
  };
}
