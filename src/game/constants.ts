// ============================================================
// AetherPaddle II - Game Constants & Configuration
// ============================================================

import type { PowerUpType } from './types';

// Canvas dimensions
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 100;
export const PLAY_AREA_TOP = HUD_HEIGHT;
export const PLAY_AREA_HEIGHT = CANVAS_HEIGHT - HUD_HEIGHT;

// Colors
export const COLORS = {
  background: '#C7F9CC',
  backgroundPattern: '#B8F0BE',
  primary: '#5A189A',
  secondary: '#7B2CBF',
  accent: '#FF9E00',
  paddleBase: '#240046',
  paddleAccent: '#E0AAFF',
  ball: '#FFFFFF',
  ballGlow: 'rgba(255, 255, 255, 0.6)',
  uiPanelBg: 'rgba(90, 24, 154, 0.15)',
  uiTextPrimary: '#3C096C',
  uiTextSecondary: '#5A189A',
  uiTextLight: '#FFFFFF',
  heartFull: '#FF4D6D',
  heartEmpty: 'rgba(255, 77, 109, 0.2)',
  shield: '#4CC9F0',
  // Brick color palettes per level theme
  brickPalettes: [
    ['#FF6D00', '#FF8500', '#FF9E00'], // Orange theme
    ['#3C096C', '#5A189A', '#7B2CBF'], // Purple theme
    ['#FF006E', '#8338EC', '#3A86FF'], // Neon theme
    ['#06D6A0', '#118AB2', '#073B4C'], // Ocean theme
    ['#E63946', '#F1FAEE', '#A8DADC'], // Sunset theme
    ['#FFBE0B', '#FB5607', '#FF006E'], // Fire theme
    ['#8338EC', '#3A86FF', '#06D6A0'], // Galaxy theme
    ['#2D6A4F', '#52B788', '#95D5B2'], // Forest theme
  ],
};

// Paddle
export const PADDLE = {
  width: 120,
  height: 16,
  y: CANVAS_HEIGHT - 40,
  speed: 0.45, // lerp factor for smooth following
  squashDuration: 8, // frames
};

// Ball
export const BALL = {
  radius: 7,
  minSpeed: 7.5,
  maxSpeed: 22,
  trailLength: 8,
  baseSpeed: 9.5,
};

// Bricks
export const BRICK = {
  width: 50,
  height: 16,   // slimmer rows → more open space between bricks and paddle
  padding: 4,
  flashDuration: 6, // frames
  colors: {
    normal: '#FF6D00',
    multi2: '#5A189A',
    multi3: '#3C096C',
    indestructible: '#6C757D',
  },
};

// Power-ups
export const POWERUP = {
  radius: 16,
  fallSpeed: 2.5,
  oscillationAmp: 2,
  oscillationFreq: 0.05,
  buffDuration: 12000, // 12 seconds in ms
  timeWarpDuration: 2000, // 2 seconds
  colors: {
    HyperBounce: '#FF9E00',
    Magnetism: '#FF70A6',
    AetherShield: '#4CC9F0',
    TimeWarp: '#7B2CBF',
    GrowPaddle: '#06D6A0',
    ShrinkPaddle: '#EF476F',
    SpeedUpBall: '#FFD166',
    SlowDownBall: '#118AB2',
    ChaosZone: '#D90429',
    BlastRadius: '#F15BB5',
    LaserPaddle: '#E65F5C',
    Multiball: '#9D4EDD',
    ExtraLife: '#FF4D6D',
  },
  labels: {
    HyperBounce: 'HYPER BOUNCE',
    Magnetism: 'MAGNETISM',
    AetherShield: 'AETHER SHIELD',
    TimeWarp: 'TIME WARP',
    GrowPaddle: 'GROW PADDLE',
    ShrinkPaddle: 'SHRINK PADDLE',
    SpeedUpBall: 'SPEED UP BALL',
    SlowDownBall: 'SLOW BALL',
    ChaosZone: 'CHAOS ZONE',
    BlastRadius: 'BLAST RADIUS',
    LaserPaddle: 'LASER PADDLE',
    Multiball: 'MULTIBALL',
    ExtraLife: 'EXTRA LIFE',
  },
  icons: {
    HyperBounce: '/assets/powerup-hyperbounce.png',
    Magnetism: '/assets/powerup-magnetism.png',
    AetherShield: '/assets/powerup-shield.png',
    TimeWarp: '/assets/powerup-timewarp.png',
    GrowPaddle: '',
    ShrinkPaddle: '',
    SpeedUpBall: '',
    SlowDownBall: '',
    ChaosZone: '',
    BlastRadius: '',
    LaserPaddle: '',
    Multiball: '',
    ExtraLife: '',
  },
};

// Lives
export const LIVES = {
  max: 2,
  initial: 2,
};

// Scoring
export const SCORING = {
  normalBrick: 100,
  multiHitFirst: 50,
  multiHitBreak: 150,
  powerUpCollect: 500,
  comboMultiplier: 0.1, // 10% per combo
  questComplete: 1000,
  levelComplete: 2000,
};

// Screen shake
export const SHAKE = {
  brickHit: 3,
  multiHit: 6,
  lifeLost: 12,
  questFail: 8,
  duration: 10, // frames
};

// Difficulty
export const DIFFICULTY = {
  baseMultiplier: 1.0,
  incrementPerLevel: 0.12,
  maxMultiplier: 4.0,
  speedScaling: 0.3, // speed increase per Dm
  brickDensityScaling: 0.15,
  multiHitScaling: 0.08,
};

// Particles
export const PARTICLES = {
  debrisCount: 8,
  sparkCount: 4,
  debrisLife: 30,
  sparkLife: 20,
  gravity: 0.15,
};

// Quests
export const QUESTS = {
  stabilization: {
    baseTime: 8, // seconds
    hitsRequired: 3,
  },
};

// Level configs
export const TOTAL_LEVELS = 16;

// Power-up drop chance (base)
export const POWERUP_DROP_CHANCE = 0.15;

// Transition timings
export const TRANSITIONS = {
  levelComplete: 180, // frames (3 seconds at 60fps)
  gameOver: 120,
  phaseBIntro: 90,
};

// localStorage key
export const STORAGE_KEY = 'aetherpaddle2_save';

// Asset paths
export const ASSETS = {
  bgPattern: '/assets/bg-pattern.jpg',
};

// Utility: get power-up color
export function getPowerUpColor(type: PowerUpType): string {
  return POWERUP.colors[type];
}

export function getPowerUpLabel(type: PowerUpType): string {
  return POWERUP.labels[type];
}

export function getPowerUpIcon(type: PowerUpType): string {
  return POWERUP.icons[type];
}
