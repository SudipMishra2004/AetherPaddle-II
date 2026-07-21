// ============================================================
// AetherPaddle II - Game Canvas Component
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import type { GameScreen } from '../game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';

interface GameCanvasProps {
  onScreenChange: (screen: GameScreen) => void;
  onEngineReady: (engine: GameEngine) => void;
  isPaused: boolean;
}

/** Returns true when the primary input is a touchscreen (no fine pointer). */
const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

/**
 * Convert a client-space X coordinate to the canvas internal coordinate,
 * accounting for CSS scaling (the canvas pixel buffer is always 1280×800
 * but the element may be scaled via CSS object-fit:contain).
 */
function clientToCanvasX(clientX: number, canvas: HTMLCanvasElement): number {
  const rect = canvas.getBoundingClientRect();
  // rect.width is the CSS-rendered width; CANVAS_WIDTH is the pixel buffer width
  const scaleX = CANVAS_WIDTH / rect.width;
  return (clientX - rect.left) * scaleX;
}

export function GameCanvas({ onScreenChange, onEngineReady, isPaused }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const lastScreenRef = useRef<GameScreen>('TITLE');

  // ── Engine bootstrap ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;
    onEngineReady(engine);

    engine.setOnStateChange(() => {
      const screen = engine.getState().screen;
      if (screen !== lastScreenRef.current) {
        lastScreenRef.current = screen;
        onScreenChange(screen);
      }
    });

    engine.startLoop();

    return () => {
      engine.stopLoop();
    };
  }, [onScreenChange, onEngineReady]);

  // ── Pause/resume ──────────────────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (isPaused && engine.getState().screen === 'PLAYING') {
      engine.pauseGame();
    } else if (!isPaused && engine.getState().screen === 'PAUSED') {
      engine.resumeGame();
    }
  }, [isPaused]);

  // ── Mouse movement (desktop) ──────────────────────────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !engineRef.current) return;
      if (isTouchDevice()) return; // ignore mouse events on touchscreen devices

      const isLocked = document.pointerLockElement === canvas;
      if (isLocked) {
        const currentMouseX = engineRef.current.getState().mouseX;
        const sensitivity = engineRef.current.sensitivity;
        engineRef.current.handleMouseMoveDirect(currentMouseX + e.movementX * sensitivity);
      } else {
        engineRef.current.handleMouseMoveDirect(clientToCanvasX(e.clientX, canvas));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ── Touch movement (mobile relative drag) ─────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTouchX: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (!engineRef.current || e.touches.length === 0) return;
      e.preventDefault();
      const touch = e.touches[0];
      lastTouchX = touch.clientX;
      // Treat a tap as a click (fires lasers if LaserPaddle is active)
      engineRef.current.handleClick();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!engineRef.current || e.touches.length === 0 || lastTouchX === null) return;
      e.preventDefault(); // stop page scroll while playing
      const touch = e.touches[0];
      const deltaClientX = touch.clientX - lastTouchX;
      lastTouchX = touch.clientX;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const deltaCanvasX = deltaClientX * scaleX;

      engineRef.current.handleTouchDelta(deltaCanvasX);
    };

    const handleTouchEnd = () => {
      lastTouchX = null;
    };

    // passive: false so we can call preventDefault() inside the handler
    canvas.addEventListener('touchstart',  handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove',   handleTouchMove,  { passive: false });
    canvas.addEventListener('touchend',    handleTouchEnd,   { passive: false });
    canvas.addEventListener('touchcancel', handleTouchEnd,   { passive: false });

    return () => {
      canvas.removeEventListener('touchstart',  handleTouchStart);
      canvas.removeEventListener('touchmove',   handleTouchMove);
      canvas.removeEventListener('touchend',    handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // ── Pointer lock (desktop only) ───────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isTouchDevice()) return;

    const handlePointerLockChange = () => {
      const engine = engineRef.current;
      if (!engine) return;
      const isLocked = document.pointerLockElement === canvas;
      if (!isLocked && engine.getState().screen === 'PLAYING') {
        engine.pauseGame();
        onScreenChange('PAUSED');
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => document.removeEventListener('pointerlockchange', handlePointerLockChange);
  }, [onScreenChange]);

  // Release pointer lock when paused externally (desktop)
  useEffect(() => {
    if (isTouchDevice()) return;
    if (isPaused && document.pointerLockElement === canvasRef.current) {
      document.exitPointerLock();
    }
  }, [isPaused]);

  // ── Click handler (desktop) ───────────────────────────────
  const handleClick = useCallback(() => {
    engineRef.current?.handleClick();
    const canvas = canvasRef.current;
    if (!isTouchDevice() && canvas && engineRef.current?.getState().screen === 'PLAYING') {
      canvas.requestPointerLock();
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleClick}
      className="block cursor-none"
      style={{
        /* Fill the parent while preserving aspect ratio.
           object-fit:contain is set globally in App.css,
           but we also set explicit max dimensions so the canvas
           never overflows the viewport on any screen size. */
        maxWidth: '100%',
        maxHeight: '100%',
        touchAction: 'none',
      }}
    />
  );
}
