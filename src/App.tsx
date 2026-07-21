// ============================================================
// AetherPaddle II - Main Application Component
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import {
  TitleScreen,
  TutorialScreen,
  PauseScreen,
  GameOverScreen,
  VictoryScreen,
  SettingsScreen,
  MenuStyles,
} from './components/Menus';
import { GameEngine } from './game/engine';
import type { GameScreen } from './game/types';
import { loadSaveData, clearGameProgress, loadGameProgress, saveGameProgress } from './game/storage';
import { LIVES } from './game/constants';
import { enterFullscreenLandscape, isMobileDevice, isFullscreen } from './game/fullscreen';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('TITLE');
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [previousScreen, setPreviousScreen] = useState<GameScreen>('TITLE');
  const containerRef = useRef<HTMLDivElement>(null);
  // Whether the browser is currently in fullscreen mode
  const [isFullscreenActive, setIsFullscreenActive] = useState(
    typeof document !== 'undefined' ? isFullscreen() : false
  );
  // Whether the mobile splash screen has been dismissed (user tapped to enter fullscreen)
  const [mobileReady, setMobileReady] = useState(false);
  // Portrait-mode detection for mobile
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  );

  // Listen to fullscreen changes to update button visibility dynamically
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreenActive(isFullscreen());
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Engine ready callback
  const handleEngineReady = useCallback((newEngine: GameEngine) => {
    setEngine(newEngine);
  }, []);

  // Screen change callback from canvas
  const handleScreenChange = useCallback((screen: GameScreen) => {
    setCurrentScreen(screen);
    if (screen === 'PAUSED') {
      setIsPaused(true);
    } else if (screen === 'PLAYING') {
      setIsPaused(false);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (currentScreen === 'PLAYING') {
          setIsPaused(true);
        } else if (currentScreen === 'PAUSED') {
          setIsPaused(false);
          engine?.resumeGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, engine]);

  // Portrait orientation detection
  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Auto-dismiss mobile splash if already in fullscreen (e.g. PWA)
  useEffect(() => {
    if (!isMobileDevice()) {
      setMobileReady(true);
    } else if (isFullscreen()) {
      setMobileReady(true);
    }
  }, []);

  // Handle mobile splash tap - enter fullscreen & lock landscape
  const handleMobileSplashTap = useCallback(async () => {
    await enterFullscreenLandscape();
    setMobileReady(true);
  }, []);

  // ==================== MENU ACTIONS ====================

  const handleStartGame = useCallback(async () => {
    // Ensure fullscreen on mobile when starting a game
    if (isMobileDevice() && !isFullscreen()) {
      await enterFullscreenLandscape();
    }
    clearGameProgress();
    engine?.startGame(false);
    setCurrentScreen('PLAYING');
    setIsPaused(false);
  }, [engine]);

  const handleContinueGame = useCallback(async () => {
    // Ensure fullscreen on mobile when continuing a game
    if (isMobileDevice() && !isFullscreen()) {
      await enterFullscreenLandscape();
    }
    const progress = loadGameProgress();
    if (progress) {
      engine?.startGame(true);
      // Load the saved level
      engine?.loadLevel(progress.level);
      // Update engine state with saved values
      if (engine) {
        const state = engine.getState();
        state.score = progress.score;
        state.lives = progress.lives > 0 ? progress.lives : LIVES.initial;
      }
      setCurrentScreen('PLAYING');
      setIsPaused(false);
    } else {
      handleStartGame();
    }
  }, [engine, handleStartGame]);


  const handleOpenSettings = useCallback(() => {
    setPreviousScreen(currentScreen);
    setCurrentScreen('SETTINGS');
  }, [currentScreen]);

  const handleBack = useCallback(() => {
    setCurrentScreen(previousScreen === 'PLAYING' ? 'TITLE' : previousScreen);
  }, [previousScreen]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    engine?.resumeGame();
  }, [engine]);

  const handleRestartLevel = useCallback(() => {
    setIsPaused(false);
    engine?.restartLevel();
  }, [engine]);

  const handleQuitToMenu = useCallback(() => {
    // Save current progress before quitting
    if (engine) {
      const state = engine.getState();
      if (state.screen === 'PLAYING' || state.screen === 'PAUSED') {
        saveGameProgress(state.level, state.score, state.lives);
      }
    }
    setIsPaused(false);
    engine?.quitToMenu();
    setCurrentScreen('TITLE');
  }, [engine]);

  const handleGameOverRestart = useCallback(() => {
    engine?.restartLevel();
    setCurrentScreen('PLAYING');
    setIsPaused(false);
  }, [engine]);

  // ==================== RENDER ====================

  const renderOverlay = () => {
    switch (currentScreen) {
      case 'TITLE':
        return (
          <TitleScreen
            onStartGame={handleStartGame}
            onContinueGame={handleContinueGame}
            onOpenTutorial={() => {
              setPreviousScreen('TITLE');
              setCurrentScreen('TUTORIAL');
            }}
            onOpenSettings={handleOpenSettings}
          />
        );

      case 'TUTORIAL':
        return (
          <TutorialScreen
            onBack={handleBack}
          />
        );

      case 'PAUSED':
        return (
          <PauseScreen
            onResume={handleResume}
            onRestart={handleRestartLevel}
            onQuit={handleQuitToMenu}
            engine={engine}
          />
        );

      case 'GAME_OVER':
        return (
          <GameOverScreen
            score={engine?.getState().score || 0}
            level={engine?.getState().level || 1}
            bestScore={loadSaveData().bestScore}
            onRestart={handleGameOverRestart}
            onMenu={handleQuitToMenu}
          />
        );

      case 'VICTORY':
        return (
          <VictoryScreen
            score={engine?.getState().score || 0}
            onMenu={handleQuitToMenu}
          />
        );


      case 'SETTINGS':
        return (
          <SettingsScreen
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ background: '#1a1a2e', minHeight: '100dvh', height: '100dvh' }}>
      <MenuStyles />

      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Game Canvas - always mounted for game loop */}
        <div className="absolute inset-0 flex items-center justify-center">
          <GameCanvas
            onScreenChange={handleScreenChange}
            onEngineReady={handleEngineReady}
            isPaused={isPaused}
          />
        </div>

        {/* Menu Overlays */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="pointer-events-auto">
            {renderOverlay()}
          </div>
        </div>

        {/* ── Mobile persistent Fullscreen Button (touch devices, shown when not in browser fullscreen) ── */}
        {isMobileDevice() && !isFullscreenActive && (
          <button
            onTouchStart={(e) => { e.preventDefault(); enterFullscreenLandscape(); }}
            onClick={() => enterFullscreenLandscape()}
            aria-label="Go Fullscreen"
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              zIndex: 45,
              background: 'linear-gradient(135deg, #FF9F00, #FF5400)',
              border: '2px solid rgba(255, 255, 255, 0.9)',
              borderRadius: 12,
              padding: '7px 15px',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: 1,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(255, 84, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ⛶ FULLSCREEN
          </button>
        )}

        {/* ── Mobile pause button (touch devices, gameplay only) ── */}
        {currentScreen === 'PLAYING' && (
          <button
            onTouchStart={(e) => { e.preventDefault(); setIsPaused(true); }}
            onClick={() => setIsPaused(true)}
            aria-label="Pause game"
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 30,
              background: 'rgba(90,24,154,0.75)',
              border: '1.5px solid rgba(224,170,255,0.5)',
              borderRadius: 10,
              padding: '6px 18px',
              color: '#E0AAFF',
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 1,
              cursor: 'pointer',
              /* Only show on touch screens */
              display: 'none',
            }}
            className="mobile-pause-btn"
          >
            ⏸ PAUSE
          </button>
        )}

        {/* ── Mobile splash: tap to enter fullscreen + lock landscape ── */}
        {!mobileReady && isMobileDevice() && (
          <div
            onClick={handleMobileSplashTap}
            onTouchStart={handleMobileSplashTap}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'linear-gradient(135deg,#10002B,#240046)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            {/* Animated phone icon */}
            <div style={{
              fontSize: 72,
              animation: 'rotateHint 2s ease-in-out infinite',
            }}>📱</div>
            <p style={{
              color: '#E0AAFF',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 1,
              lineHeight: 1.4,
            }}>
              Tap to Enter Fullscreen
            </p>
            <p style={{ color: 'rgba(224,170,255,0.6)', fontSize: 14, maxWidth: 300 }}>
              AetherPaddle II plays best in fullscreen landscape mode.
              Tap anywhere to start!
            </p>
            <div style={{
              marginTop: 8,
              padding: '12px 32px',
              borderRadius: 16,
              background: 'rgba(90,24,154,0.6)',
              border: '2px solid rgba(224,170,255,0.4)',
              color: '#E0AAFF',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 1.5,
              animation: 'tapPulse 1.5s ease-in-out infinite',
            }}>
              ▶ TAP TO PLAY
            </div>
          </div>
        )}

        {/* ── Portrait-mode rotation prompt (shown after splash is dismissed but still portrait) ── */}
        {mobileReady && isPortrait && isMobileDevice() && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              background: 'linear-gradient(135deg,#10002B,#240046)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: 72,
              animation: 'rotateHint 2s ease-in-out infinite',
            }}>📱</div>
            <p style={{
              color: '#E0AAFF',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 1,
              lineHeight: 1.4,
            }}>
              Rotate to Landscape
            </p>
            <p style={{ color: 'rgba(224,170,255,0.6)', fontSize: 14, maxWidth: 280 }}>
              AetherPaddle II plays best in landscape mode.
              Turn your device sideways to continue!
            </p>
          </div>
        )}

        <style>{`
          @keyframes rotateHint {
            0%   { transform: rotate(0deg); }
            30%  { transform: rotate(-90deg); }
            60%  { transform: rotate(-90deg); }
            90%  { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
          @keyframes tapPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.85; }
          }
          @media (pointer: coarse) {
            .mobile-pause-btn { display: block !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default App;
