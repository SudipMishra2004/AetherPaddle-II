// ============================================================
// AetherPaddle II - Level Definitions (20 Levels)
// ============================================================

import type { LevelConfig, LevelProfile } from './types';
import { COLORS, TOTAL_LEVELS } from './constants';

function generateLevelConfigs(): LevelConfig[] {
  const configs: LevelConfig[] = [];

  // Explicitly handcrafted level profiles to fit their names and increase variety.
  // We replaced the redundant diamond profiles at L6, L11, L16 with Split, Columns, and Core.
  const levelProfiles: LevelProfile[] = [
    'Open',     // 1: First Bounce
    'Wall',     // 2: Double Trouble
    'Funnel',   // 3: The Funnel
    'Gauntlet', // 4: Wall of Silence
    'Cage',     // 5: The Great Wall
    'Split',    // 6: Narrow Path (replaces Open diamond)
    'Wall',     // 7: Ricochet Master
    'Funnel',   // 8: Gauntlet Entry
    'Gauntlet', // 9: The Maze
    'Cage',     // 10: Fortress
    'Columns',  // 11: Tight Squeeze (replaces Open diamond)
    'Wall',     // 12: Crystal Palace
    'Funnel',   // 13: Death Alley
    'Gauntlet', // 14: The Labyrinth
    'Cage',     // 15: Iron Curtain
    'Core',     // 16: Aether Core (replaces Open diamond)
  ];

  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const profile = levelProfiles[i - 1] || 'Open';
    const questType = 'Stabilization' as const;
    const colorIndex = Math.floor((i - 1) / 3) % COLORS.brickPalettes.length;
    const progress = (i - 1) / (TOTAL_LEVELS - 1); // 0 to 1

    // Ball speed: ramp naturally for levels 1-5, then tier up at 6, 11, 16
    // All values are well below BALL.maxSpeed (22) so the DM still applies
    let ballSpeed: number;
    if (i <= 5) {
      ballSpeed = 9.5 + progress * 7.0; // 9.5 → ~11.4 over early levels
    } else if (i <= 10) {
      ballSpeed = 12; // Steady hands — comfortable mid-game speed
    } else if (i < 16) {
      ballSpeed = 13.5; // Elevated but manageable late-game speed
    } else {
      ballSpeed = 14.4; // Final boss speed
    }

    const rows = Math.min(6 + Math.floor(progress * 6), 12); // More rows: 6 to 12

    // Cols: levels 1-5 grow from 12→13; levels 6+ are capped at 14 so the brick
    // field stays narrower/more centered — leaving more open wall space on both
    // sides and giving the player extra reaction time.
    const cols = i <= 5
      ? Math.min(12 + Math.floor(progress * 6), 13)
      : 14;

    const multiHitRatio = Math.min(progress * 0.65, 0.65); // More multi-hit bricks
    const indestructibleRatio = i > 4 ? Math.min((i - 4) * 0.04, 0.20) : 0; // More indestructible bricks
    const powerUpChance = Math.min(0.12 + progress * 0.18, 0.30); // Slightly more power-ups to help
    const questDifficulty = 1 + Math.floor(progress * 9); // 1 to 10

    configs.push({
      id: i,
      name: getLevelName(i),
      profile,
      rows,
      cols,
      ballSpeed,
      multiHitRatio,
      indestructibleRatio,
      powerUpChance,
      brickColors: COLORS.brickPalettes[colorIndex],
      questType,
      questDifficulty,
    });
  }

  return configs;
}

function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: 'First Bounce',
    2: 'Double Trouble',
    3: 'The Funnel',
    4: 'Wall of Silence',
    5: 'The Great Wall',
    6: 'Narrow Path',
    7: 'Ricochet Master',
    8: 'Gauntlet Entry',
    9: 'The Maze',
    10: 'Fortress',
    11: 'Tight Squeeze',
    12: 'Crystal Palace',
    13: 'Death Alley',
    14: 'The Labyrinth',
    15: 'Iron Curtain',
    16: 'Aether Core',
  };
  return names[level] || `Level ${level}`;
}

export const LEVEL_CONFIGS = generateLevelConfigs();

// Layout generators for different profiles
export interface BrickLayout {
  type: 'normal' | 'multi2' | 'multi3' | 'indestructible';
  col: number;
  row: number;
}

export function generateLayout(
  profile: LevelProfile,
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  switch (profile) {
    case 'Open':
      return generateOpenLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Wall':
      return generateWallLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Funnel':
      return generateFunnelLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Gauntlet':
      return generateGauntletLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Cage':
      return generateCageLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Split':
      return generateSplitLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Columns':
      return generateColumnsLayout(rows, cols, multiHitRatio, indestructibleRatio);
    case 'Core':
      return generateCoreLayout(rows, cols, multiHitRatio, indestructibleRatio);
    default:
      return generateOpenLayout(rows, cols, multiHitRatio, indestructibleRatio);
  }
}

function generateOpenLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];
  const midCol = (cols - 1) / 2;
  const midRow = (rows + 1) / 2;

  for (let r = 1; r <= rows; r++) {
    // Determine maximum allowed distance for diamond pattern
    const rowProgress = Math.abs(r - midRow) / (rows / 2); // 1 at top/bottom, 0 at center
    const maxDist = (cols / 2) * (1 - rowProgress * 0.7); // Diamond/pyramid boundaries

    for (let c = 0; c < cols; c++) {
      const distFromCenter = Math.abs(c - midCol);
      if (distFromCenter <= maxDist) {
        // Designer checkerboard pattern
        if ((r + c) % 2 === 0) {
          const rand = Math.random();
          let type: BrickLayout['type'] = 'normal';
          if (rand < indestructibleRatio) {
            type = 'indestructible';
          } else if (rand < indestructibleRatio + multiHitRatio) {
            type = Math.random() < 0.6 ? 'multi2' : 'multi3';
          }
          result.push({ type, col: c, row: r });
        }
      }
    }
  }
  return result;
}

function generateWallLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];

  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Top row (battlements): alternate bricks
      if (r === 1 && c % 2 !== 0) continue;
      
      // Bottom rows: create some archways/gates (gaps every 5 columns on the bottom two rows)
      if (r >= rows - 1 && (c % 5 === 2)) continue;

      const rand = Math.random();
      let type: BrickLayout['type'] = 'normal';
      const adjustedMultiRatio = multiHitRatio * 1.5;
      
      if (rand < indestructibleRatio) {
        type = 'indestructible';
      } else if (rand < indestructibleRatio + adjustedMultiRatio) {
        type = Math.random() < 0.5 ? 'multi2' : 'multi3';
      }
      result.push({ type, col: c, row: r });
    }
  }
  return result;
}

function generateFunnelLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];
  const midCol = (cols - 1) / 2;
  const midRow = (rows + 1) / 2;

  for (let r = 1; r <= rows; r++) {
    const rowProgress = Math.abs(r - midRow) / (rows / 2); // 1 at top/bottom, 0 in middle
    const allowedWidth = Math.max(1.5, cols * 0.45 * rowProgress + 1);

    for (let c = 0; c < cols; c++) {
      const distFromCenter = Math.abs(c - midCol);

      if (distFromCenter <= allowedWidth) {
        // Core inside the narrow part is indestructible / multi-hit
        const isCore = Math.abs(r - midRow) <= 1 && distFromCenter <= 1;
        const rand = Math.random();
        let type: BrickLayout['type'] = 'normal';
        
        if (isCore) {
          type = 'indestructible';
        } else if (rand < indestructibleRatio) {
          type = 'indestructible';
        } else if (rand < indestructibleRatio + multiHitRatio) {
          type = Math.random() < 0.6 ? 'multi2' : 'multi3';
        }
        result.push({ type, col: c, row: r });
      }
    }
  }
  return result;
}

function generateGauntletLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];

  for (let r = 1; r <= rows; r++) {
    // Sine wave center position
    const waveCenter = (cols - 1) / 2 + Math.sin(r * 0.9) * (cols * 0.28);
    const roadWidth = Math.max(2.2, cols * 0.16); // Width of the gap path

    for (let c = 0; c < cols; c++) {
      // If inside the path, leave empty for the ball to move through
      if (Math.abs(c - waveCenter) < roadWidth) continue;

      const rand = Math.random();
      let type: BrickLayout['type'] = 'normal';
      
      if (rand < indestructibleRatio) {
        type = 'indestructible';
      } else if (rand < indestructibleRatio + multiHitRatio) {
        type = Math.random() < 0.4 ? 'multi2' : 'multi3';
      }
      result.push({ type, col: c, row: r });
    }
  }
  return result;
}

function generateCageLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];
  const midCol = (cols - 1) / 2;
  const midRow = (rows + 1) / 2;

  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Distance formulas for a diamond shape ring
      const dx = Math.abs(c - midCol) / (cols / 2);
      const dy = Math.abs(r - midRow) / (rows / 2);
      const dist = dx + dy;

      // Outer ring: dist between 0.6 and 0.95
      // Center core: dist <= 0.22
      const isRing = dist >= 0.65 && dist <= 0.95;
      const isCore = dist <= 0.22;

      if (isRing || isCore) {
        const rand = Math.random();
        let type: BrickLayout['type'] = 'normal';
        
        if (isCore) {
          type = 'indestructible';
        } else if (isRing && (r === 1 || r === rows || c === 0 || c === cols - 1)) {
          type = Math.random() < 0.5 ? 'indestructible' : 'multi3';
        } else {
          if (rand < indestructibleRatio) {
            type = 'indestructible';
          } else if (rand < indestructibleRatio + multiHitRatio) {
            type = Math.random() < 0.7 ? 'multi2' : 'multi3';
          }
        }
        result.push({ type, col: c, row: r });
      }
    }
  }
  return result;
}

// Get difficulty multiplier for a given level
export function getDifficultyMultiplier(level: number): number {
  const progress = (level - 1) / (TOTAL_LEVELS - 1);
  return 1.0 + progress * 3.0; // 1.0x to 4.0x
}

function generateSplitLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];
  const midCol = (cols - 1) / 2;

  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Leave a 3-column corridor in the middle (Narrow Path)
      if (Math.abs(c - midCol) < 1.5) continue;

      const rand = Math.random();
      let type: BrickLayout['type'] = 'normal';
      if (rand < indestructibleRatio) {
        type = 'indestructible';
      } else if (rand < indestructibleRatio + multiHitRatio) {
        type = Math.random() < 0.6 ? 'multi2' : 'multi3';
      }
      result.push({ type, col: c, row: r });
    }
  }
  return result;
}

function generateColumnsLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];
  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Corridor tracks at column 4 and column 9 (Tight Squeezes!)
      if (c === 4 || c === 9) continue;

      const rand = Math.random();
      let type: BrickLayout['type'] = 'normal';
      if (rand < indestructibleRatio) {
        type = 'indestructible';
      } else if (rand < indestructibleRatio + multiHitRatio) {
        type = Math.random() < 0.5 ? 'multi2' : 'multi3';
      }
      result.push({ type, col: c, row: r });
    }
  }
  return result;
}

function generateCoreLayout(
  rows: number,
  cols: number,
  multiHitRatio: number,
  indestructibleRatio: number
): BrickLayout[] {
  const result: BrickLayout[] = [];
  const midCol = (cols - 1) / 2;
  const midRow = (rows + 1) / 2;

  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const distCol = Math.abs(c - midCol);
      const distRow = Math.abs(r - midRow);

      // Central 4x4 Core
      const isCore = distCol <= 2 && distRow <= 2;
      // Outer Core Wrapper
      const isWrapper = distCol <= 4 && distRow <= 4;

      let type: BrickLayout['type'] = 'normal';
      const rand = Math.random();

      if (isCore) {
        // High durability Core components
        type = Math.random() < 0.4 ? 'indestructible' : 'multi3';
      } else if (isWrapper) {
        type = rand < 0.6 ? 'multi2' : 'multi3';
      } else {
        if (rand < indestructibleRatio * 0.5) {
          type = 'indestructible';
        } else if (rand < indestructibleRatio * 0.5 + multiHitRatio) {
          type = 'normal';
        } else {
          type = 'normal';
        }
      }
      result.push({ type, col: c, row: r });
    }
  }
  return result;
}
