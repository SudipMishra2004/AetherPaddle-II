// ============================================================
// AetherPaddle II - Core Type Definitions
// ============================================================

export interface Vec2 {
  x: number;
  y: number;
}

export type GameScreen =
  | 'TITLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAME_OVER'
  | 'LEVEL_COMPLETE'
  | 'VICTORY'
  | 'SETTINGS'
  | 'TUTORIAL';

export type LevelProfile = 'Open' | 'Wall' | 'Funnel' | 'Gauntlet' | 'Cage' | 'Split' | 'Columns' | 'Core';

export type BrickType = 'normal' | 'multi2' | 'multi3' | 'indestructible';

export type PowerUpType =
  | 'HyperBounce'
  | 'Magnetism'
  | 'AetherShield'
  | 'TimeWarp'
  | 'GrowPaddle'
  | 'ShrinkPaddle'
  | 'SpeedUpBall'
  | 'SlowDownBall'
  | 'ChaosZone'
  | 'BlastRadius'
  | 'LaserPaddle'
  | 'Multiball'
  | 'ExtraLife';

export interface LaserBeam {
  id: string;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
}

export type QuestType = 'Stabilization';

export type GamePhase = 'PHASE_A' | 'PHASE_B';

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  hp: number;
  maxHp: number;
  color: string;
  flashTimer: number; // frames remaining for hit flash
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  squashScale: number;
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  baseSpeed: number;
  trail: Vec2[];
  frozen: boolean; // for Time Warp
}

export interface PowerUpEntity {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: PowerUpType;
  vy: number;
  vyOscillation: number;
  collected: boolean;
}

export interface ActiveBuff {
  type: PowerUpType;
  duration: number;
  maxDuration: number;
  startTime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'debris' | 'spark' | 'trail' | 'heart_break';
}

export interface StarParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  profile: LevelProfile;
  rows: number;
  cols: number;
  ballSpeed: number;
  multiHitRatio: number;
  indestructibleRatio: number;
  powerUpChance: number;
  brickColors: string[];
  questType: QuestType;
  questDifficulty: number; // 1-10
}

export interface QuestState {
  active: boolean;
  type: QuestType;
  description: string;
  timer: number;
  maxTimer: number;
  hitsRequired: number;
  hitsCurrent: number;
  completed: boolean;
  failed: boolean;
  fluxForceX: number;
  fluxForceY: number;
  fluxForceTimer: number;
  fluxBricks: Brick[];
}

export interface GameState {
  screen: GameScreen;
  phase: GamePhase;
  level: number;
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  comboMultiplier: number;
  difficultyMultiplier: number;
  paddle: Paddle;
  balls: Ball[];
  bricks: Brick[];
  powerUps: PowerUpEntity[];
  activeBuffs: ActiveBuff[];
  particles: Particle[];
  starParticles: StarParticle[];
  quest: QuestState;
  screenShake: { intensity: number; duration: number };
  timeWarpActive: boolean;
  timeWarpTimer: number;
  shieldActive: boolean;
  mouseX: number;
  isPaused: boolean;
  levelTransitionTimer: number;
  gameOverTimer: number;
  totalLevels: number;
  breakRoomReady: boolean;
  bestScore: number;
  unlockedLevel: number;
  lasers: LaserBeam[];
  laserCooldown: number;
}

export interface SaveData {
  bestScore: number;
  unlockedLevel: number;
  currentLevel: number;
  currentScore: number;
  currentLives: number;
  hasSave: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
}
