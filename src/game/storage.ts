// ============================================================
// AetherPaddle II - localStorage Save/Load System
// ============================================================

import type { SaveData, GameSettings } from './types';
import { STORAGE_KEY } from './constants';

const DEFAULT_SAVE: SaveData = {
  bestScore: 0,
  unlockedLevel: 1,
  currentLevel: 1,
  currentScore: 0,
  currentLives: 2,
  hasSave: false,
  soundEnabled: true,
  musicEnabled: true,
  paddleSensitivity: 1.5,
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed = JSON.parse(raw) as SaveData;
    // Merge with defaults for any missing fields
    return { ...DEFAULT_SAVE, ...parsed };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

export function updateBestScore(score: number): void {
  const data = loadSaveData();
  if (score > data.bestScore) {
    data.bestScore = score;
    saveSaveData(data);
  }
}

export function updateUnlockedLevel(level: number): void {
  const data = loadSaveData();
  if (level > data.unlockedLevel) {
    data.unlockedLevel = level;
    saveSaveData(data);
  }
}

export function saveGameProgress(level: number, score: number, lives: number): void {
  const data = loadSaveData();
  data.currentLevel = level;
  data.currentScore = score;
  data.currentLives = lives;
  data.hasSave = true;
  if (score > data.bestScore) {
    data.bestScore = score;
  }
  if (level > data.unlockedLevel) {
    data.unlockedLevel = level;
  }
  saveSaveData(data);
}

export function clearGameProgress(): void {
  const data = loadSaveData();
  data.currentLevel = 1;
  data.currentScore = 0;
  data.currentLives = 2;
  data.hasSave = false;
  saveSaveData(data);
}

export function loadGameProgress(): { level: number; score: number; lives: number } | null {
  const data = loadSaveData();
  if (!data.hasSave) return null;
  return {
    level: data.currentLevel,
    score: data.currentScore,
    lives: data.currentLives,
  };
}



export function getSettings(): GameSettings {
  const data = loadSaveData();
  return {
    soundEnabled: data.soundEnabled,
    musicEnabled: data.musicEnabled,
    paddleSensitivity: typeof data.paddleSensitivity === 'number' ? data.paddleSensitivity : 1.5,
  };
}

export function saveSettings(settings: GameSettings): void {
  const data = loadSaveData();
  data.soundEnabled = settings.soundEnabled;
  data.musicEnabled = settings.musicEnabled;
  data.paddleSensitivity = settings.paddleSensitivity;
  saveSaveData(data);
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
