// ============================================================
// AetherPaddle II - Menu Screens & UI Components
// ============================================================

import { useState, useEffect } from 'react';
import { Heart, Play, RotateCcw, Settings, Home, ChevronRight, Volume2, VolumeX, Music, HelpCircle, Pause, ArrowLeft, Star, Zap, Shield, Trophy } from 'lucide-react';
import { loadSaveData, saveSettings, getSettings, resetAllData } from '../game/storage';
import type { PowerUpType } from '../game/types';
import { LEVEL_CONFIGS } from '../game/levels';
import { COLORS, POWERUP } from '../game/constants';
import type { GameEngine } from '../game/engine';
import { gameAudio } from '../game/audio';

// ==================== TITLE SCREEN ====================

interface TitleScreenProps {
  onStartGame: () => void;
  onContinueGame: () => void;
  onOpenTutorial: () => void;
  onOpenSettings: () => void;
}

export function TitleScreen({ onStartGame, onContinueGame, onOpenTutorial, onOpenSettings }: TitleScreenProps) {
  const [hasSave, setHasSave] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    const data = loadSaveData();
    setHasSave(data.hasSave);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center p-1 sm:p-4"
      style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-15"
            style={{
              width: 6 + (i % 3) * 6,
              height: 6 + (i % 3) * 6,
              background: COLORS.primary,
              left: `${(i * 10.3) % 100}%`,
              top: `${(i * 13.7) % 100}%`,
              animation: `float ${5 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i % 3) * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 w-full max-w-[300px] sm:max-w-md px-2 sm:px-8 flex flex-col items-center justify-center my-auto overflow-y-auto max-h-[100dvh]"
        style={{ gap: 'clamp(4px, 2vh, 28px)' }}
      >
        {/* Game Title */}
        <div className="text-center">
          <h1
            className="font-black tracking-tight leading-none"
            style={{
              fontFamily: "'Fredoka One', 'Nunito', sans-serif",
              color: COLORS.primary,
              fontSize: 'clamp(1.35rem, 8vh, 4.2rem)',
              textShadow: `0 3px 0 ${COLORS.secondary}, 0 8px 24px rgba(90,24,154,0.25)`,
              animation: 'titlePulse 3s ease-in-out infinite',
            }}
          >
            AetherPaddle{' '}
            <span
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                color: COLORS.accent,
                fontSize: 'clamp(1.05rem, 6vh, 3.2rem)',
                textShadow: `0 2px 0 rgba(255,158,0,0.35)`,
              }}
            >
              II
            </span>
          </h1>
          <p
            className="font-semibold sm:tracking-widest uppercase opacity-90"
            style={{
              color: COLORS.uiTextSecondary,
              fontSize: 'clamp(0.58rem, 2.2vh, 1rem)',
              marginTop: 'clamp(2px, 0.6vh, 8px)',
            }}
          >
            Physics-Based Arcade Challenge
          </p>
        </div>

        {/* Menu Buttons — 2 columns on mobile, 1 column spacious on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-1 w-full" style={{ gap: 'clamp(4px, 1.5vh, 16px)' }}>
          {hasSave && (
            <MenuButton
              icon={<Play className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
              label="CONTINUE"
              color={COLORS.secondary}
              hoverColor={COLORS.primary}
              onClick={onContinueGame}
              isHovered={hoveredBtn === 'continue'}
              onHover={() => setHoveredBtn('continue')}
              onLeave={() => setHoveredBtn(null)}
            />
          )}

          <MenuButton
            icon={<ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
            label="NEW GAME"
            color={COLORS.accent}
            hoverColor="#E8890A"
            onClick={onStartGame}
            isHovered={hoveredBtn === 'newgame'}
            onHover={() => setHoveredBtn('newgame')}
            onLeave={() => setHoveredBtn(null)}
          />

          <MenuButton
            icon={<HelpCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
            label="HOW TO PLAY"
            color={COLORS.uiTextSecondary}
            hoverColor={COLORS.primary}
            onClick={onOpenTutorial}
            isHovered={hoveredBtn === 'tutorial'}
            onHover={() => setHoveredBtn('tutorial')}
            onLeave={() => setHoveredBtn(null)}
          />

          <MenuButton
            icon={<Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
            label="SETTINGS"
            color={COLORS.uiTextSecondary}
            hoverColor={COLORS.primary}
            onClick={onOpenSettings}
            isHovered={hoveredBtn === 'settings'}
            onHover={() => setHoveredBtn('settings')}
            onLeave={() => setHoveredBtn(null)}
          />
        </div>

        <p
          className="opacity-45 text-center tracking-wider uppercase font-semibold"
          style={{ color: COLORS.uiTextPrimary, fontSize: 'clamp(0.5rem, 1.6vh, 0.75rem)' }}
        >
          v2.0.0 • Touch & drag / Mouse to play
        </p>
      </div>
    </div>
  );
}

// ==================== MENU BUTTON ====================

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  hoverColor: string;
  onClick: () => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function MenuButton({ icon, label, color, hoverColor, onClick, isHovered, onHover, onLeave }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="flex items-center justify-center gap-1 sm:gap-3.5 w-full rounded-lg sm:rounded-2xl font-black transition-all duration-200 active:scale-95 hover:shadow-xl hover:-translate-y-1"
      style={{
        background: isHovered ? hoverColor : 'rgba(255,255,255,0.85)',
        color: isHovered ? '#FFFFFF' : color,
        boxShadow: isHovered ? `0 8px 25px ${hoverColor}45` : '0 4px 12px rgba(0,0,0,0.06)',
        padding: 'clamp(5px, 1.5vh, 16px) 8px',
        fontSize: 'clamp(0.64rem, 2.4vh, 1rem)',
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="tracking-wider uppercase truncate">{label}</span>
    </button>
  );
}

// ==================== TUTORIAL SCREEN ====================

interface TutorialScreenProps {
  onBack: () => void;
}

export function TutorialScreen({ onBack }: TutorialScreenProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}
    >
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-5 px-2.5 sm:px-10 pt-2 sm:pt-8 pb-1 sm:pb-5 max-w-4xl w-full mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all active:scale-95 hover:bg-white shadow-sm hover:shadow-md"
          style={{ background: 'rgba(255,255,255,0.85)', color: COLORS.primary, fontWeight: 800 }}
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm tracking-wide">Back</span>
        </button>
        <h2
          className="font-black text-sm sm:text-3xl"
          style={{
            color: COLORS.primary,
            fontFamily: "'Fredoka One', sans-serif",
          }}
        >
          How to Play
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-2.5 sm:px-10 pb-3 sm:pb-10 max-w-4xl w-full mx-auto space-y-2 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-5">
          <TutorialCard
            icon={<Zap className="w-3.5 h-3.5 sm:w-6 sm:h-6" />}
            title="Control"
            description="Touch & drag or move mouse left/right to position paddle."
            color={COLORS.accent}
          />
          <TutorialCard
            icon={<Star className="w-3.5 h-3.5 sm:w-6 sm:h-6" />}
            title="Bricks"
            description="Hit bricks with the ball. Multi-hit bricks show HP."
            color={COLORS.secondary}
          />
          <TutorialCard
            icon={<Shield className="w-3.5 h-3.5 sm:w-6 sm:h-6" />}
            title="Power-Ups"
            description="Catch dropped power-ups for temporary buffs."
            color={COLORS.shield}
          />
          <TutorialCard
            icon={<Trophy className="w-3.5 h-3.5 sm:w-6 sm:h-6" />}
            title="Advance"
            description="Clear all bricks to advance to the next level."
            color="#FF006E"
          />
        </div>

        <div className="p-2 sm:p-8 rounded-xl sm:rounded-3xl shadow-sm" style={{ background: 'rgba(90,24,154,0.08)' }}>
          <h3 className="font-bold mb-1.5 sm:mb-5 text-xs sm:text-xl tracking-wide" style={{ color: COLORS.primary }}>
            Power-Up Guide
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 sm:gap-4">
            <PowerUpGuide type="HyperBounce" desc="Speed+" />
            <PowerUpGuide type="Magnetism" desc="Attract" />
            <PowerUpGuide type="AetherShield" desc="Shield" />
            <PowerUpGuide type="TimeWarp" desc="Freeze" />
            <PowerUpGuide type="GrowPaddle" desc="Bigger" />
            <PowerUpGuide type="ShrinkPaddle" desc="Smaller" />
            <PowerUpGuide type="SpeedUpBall" desc="Fast" />
            <PowerUpGuide type="SlowDownBall" desc="Slow" />
            <PowerUpGuide type="ChaosZone" desc="Danger" />
            <PowerUpGuide type="BlastRadius" desc="Explode" />
            <PowerUpGuide type="LaserPaddle" desc="Laser" />
            <PowerUpGuide type="Multiball" desc="3 balls" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div
      className="rounded-xl sm:rounded-2xl p-2 sm:p-5 shadow-xs sm:shadow-sm transition-all hover:sm:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.85)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="flex items-center gap-1 sm:gap-2.5 mb-0.5 sm:mb-2" style={{ color }}>
        {icon}
        <h3 className="font-bold text-xs sm:text-base" style={{ color: COLORS.primary }}>{title}</h3>
      </div>
      <p className="text-[0.65rem] sm:text-sm leading-tight sm:leading-relaxed" style={{ color: COLORS.uiTextSecondary }}>{description}</p>
    </div>
  );
}

function PowerUpGuide({ type, desc }: { type: PowerUpType; desc: string }) {
  const icon = POWERUP.icons[type];

  let fallbackSymbol = '';
  if (type === 'GrowPaddle') fallbackSymbol = '+';
  else if (type === 'ShrinkPaddle') fallbackSymbol = '-';
  else if (type === 'SpeedUpBall') fallbackSymbol = '>>';
  else if (type === 'SlowDownBall') fallbackSymbol = '<<';
  else if (type === 'ChaosZone') fallbackSymbol = '!';
  else if (type === 'BlastRadius') fallbackSymbol = '*';
  else if (type === 'LaserPaddle') fallbackSymbol = 'L';
  else if (type === 'Multiball') fallbackSymbol = '3x';

  return (
    <div
      className="flex flex-col items-center gap-0.5 sm:gap-1.5 rounded-lg sm:rounded-2xl p-1 sm:p-3.5 shadow-xs"
      style={{ background: 'rgba(255,255,255,0.7)' }}
    >
      {icon ? (
        <img src={icon} alt={type} className="w-5 h-5 sm:w-9 sm:h-9 object-contain" />
      ) : (
        <div
          className="w-5 h-5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border"
          style={{
            background: POWERUP.colors[type],
            borderColor: 'rgba(255,255,255,0.8)',
            color: '#10002B',
            fontSize: '0.7rem',
            fontWeight: 800,
          }}
        >
          {fallbackSymbol}
        </div>
      )}
      <span className="text-center leading-tight text-[0.5rem] sm:text-xs font-black truncate w-full" style={{ color: POWERUP.colors[type] }}>{POWERUP.labels[type]}</span>
      <span className="text-center leading-tight text-[0.45rem] sm:text-xs opacity-85 font-medium" style={{ color: COLORS.uiTextSecondary }}>{desc}</span>
    </div>
  );
}

// ==================== PAUSE SCREEN ====================

interface PauseScreenProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  engine: GameEngine | null;
}

export function PauseScreen({ onResume, onRestart, onQuit, engine }: PauseScreenProps) {
  const state = engine?.getState();
  const [settings, setSettings] = useState(getSettings());

  const handleSensitivityChange = (val: number) => {
    const next = { ...settings, paddleSensitivity: val };
    setSettings(next);
    saveSettings(next);
    engine?.setSensitivity(val);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden flex items-center justify-center p-2 sm:p-8"
      style={{ background: 'rgba(60,9,108,0.82)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="flex flex-col items-center w-full max-w-[250px] sm:max-w-md rounded-xl sm:rounded-3xl my-auto overflow-y-auto max-h-[96dvh]"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.38)',
          padding: 'clamp(6px, 1.5vh, 40px) clamp(8px, 2.5vw, 40px)',
          gap: 'clamp(3px, 1.2vh, 24px)',
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Pause className="w-3.5 h-3.5 sm:w-9 sm:h-9" style={{ color: COLORS.primary }} />
          <h2
            className="font-black text-base sm:text-4xl"
            style={{ color: COLORS.primary, fontFamily: "'Fredoka One', sans-serif" }}
          >
            PAUSED
          </h2>
        </div>

        {state && (
          <div className="text-center space-y-0.5 sm:space-y-1.5">
            <p className="text-[0.65rem] sm:text-base font-semibold" style={{ color: COLORS.uiTextSecondary }}>
              Level {state.level}: {LEVEL_CONFIGS[state.level - 1]?.name}
            </p>
            <p className="font-extrabold text-xs sm:text-2xl" style={{ color: COLORS.accent }}>
              Score: {state.score.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-2">
              {Array.from({ length: state.lives }).map((_, i) => (
                <Heart key={i} className="w-2.5 h-2.5 sm:w-5 sm:h-5" fill={COLORS.heartFull} color={COLORS.heartFull} />
              ))}
            </div>
          </div>
        )}

        <div className="w-full">
          <SensitivityControl value={settings.paddleSensitivity} onChange={handleSensitivityChange} compact />
        </div>

        <div className="flex flex-col w-full gap-1 sm:gap-3.5">
          <ActionButton icon={<Play className="w-3 h-3 sm:w-5 sm:h-5" />} label="RESUME" color={COLORS.secondary} onClick={onResume} />
          <ActionButton icon={<RotateCcw className="w-3 h-3 sm:w-5 sm:h-5" />} label="RESTART LEVEL" color={COLORS.accent} onClick={onRestart} />
          <ActionButton icon={<Home className="w-3 h-3 sm:w-5 sm:h-5" />} label="QUIT TO MENU" color="#888" onClick={onQuit} />
        </div>
      </div>
    </div>
  );
}

// ==================== GAME OVER SCREEN ====================

interface GameOverScreenProps {
  score: number;
  level: number;
  bestScore: number;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ score, level, bestScore, onRestart, onMenu }: GameOverScreenProps) {
  const isNewBest = score > 0 && score >= bestScore;

  return (
    <div
      className="absolute inset-0 overflow-hidden flex items-center justify-center p-2 sm:p-8"
      style={{ background: 'rgba(60,9,108,0.88)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="flex flex-col items-center w-full max-w-[250px] sm:max-w-md rounded-xl sm:rounded-3xl my-auto overflow-y-auto max-h-[96dvh]"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.38)',
          padding: 'clamp(6px, 1.5vh, 40px) clamp(8px, 2.5vw, 40px)',
          gap: 'clamp(3px, 1.2vh, 24px)',
        }}
      >
        <h2
          className="font-black text-lg sm:text-5xl"
          style={{
            color: '#FF4D6D',
            fontFamily: "'Fredoka One', sans-serif",
            textShadow: '0 3px 0 rgba(255,77,109,0.25)',
          }}
        >
          GAME OVER
        </h2>

        {isNewBest && (
          <div className="flex items-center gap-1 px-2 py-0.5 sm:px-5 sm:py-2 rounded-full" style={{ background: COLORS.accent + '22' }}>
            <Star className="w-2.5 h-2.5 sm:w-5 sm:h-5" fill={COLORS.accent} color={COLORS.accent} />
            <span className="font-bold text-[0.62rem] sm:text-sm tracking-wide" style={{ color: COLORS.accent }}>NEW BEST SCORE!</span>
          </div>
        )}

        <div
          className="w-full space-y-0.5 sm:space-y-3.5 py-1 sm:py-5"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.08)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <div className="flex justify-between items-center text-[0.65rem] sm:text-base">
            <span style={{ color: COLORS.uiTextSecondary }}>Final Score</span>
            <span className="font-black text-[0.7rem] sm:text-2xl" style={{ color: COLORS.primary }}>{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-[0.65rem] sm:text-base">
            <span style={{ color: COLORS.uiTextSecondary }}>Level Reached</span>
            <span className="font-bold sm:text-lg" style={{ color: COLORS.secondary }}>{level}</span>
          </div>
          <div className="flex justify-between items-center text-[0.65rem] sm:text-base">
            <span style={{ color: COLORS.uiTextSecondary }}>Best Score</span>
            <span className="font-bold sm:text-lg" style={{ color: COLORS.accent }}>{bestScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col w-full gap-1 sm:gap-3.5">
          <ActionButton icon={<RotateCcw className="w-3 h-3 sm:w-5 sm:h-5" />} label="TRY AGAIN" color={COLORS.secondary} onClick={onRestart} />
          <ActionButton icon={<Home className="w-3 h-3 sm:w-5 sm:h-5" />} label="MAIN MENU" color="#888" onClick={onMenu} />
        </div>
      </div>
    </div>
  );
}

// ==================== VICTORY SCREEN ====================

interface VictoryScreenProps {
  score: number;
  onMenu: () => void;
}

export function VictoryScreen({ score, onMenu }: VictoryScreenProps) {
  return (
    <div
      className="absolute inset-0 overflow-hidden flex items-center justify-center p-2 sm:p-8"
      style={{ background: 'rgba(90,24,154,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 6 + (i % 3) * 6,
              height: 6 + (i % 3) * 6,
              background: [COLORS.accent, COLORS.secondary, '#FF006E', COLORS.shield][i % 4],
              left: `${(i * 4.3) % 100}%`,
              top: '-20px',
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              animation: `confettiFall ${3 + (i % 4)}s linear infinite`,
              animationDelay: `${(i % 5) * 0.5}s`,
              transform: `rotate(${i * 20}deg)`,
            }}
          />
        ))}
      </div>

      <div
        className="flex flex-col items-center w-full max-w-[250px] sm:max-w-md rounded-xl sm:rounded-3xl relative z-10 my-auto overflow-y-auto max-h-[96dvh]"
        style={{
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.38)',
          padding: 'clamp(6px, 1.5vh, 40px) clamp(8px, 2.5vw, 40px)',
          gap: 'clamp(3px, 1.2vh, 24px)',
        }}
      >
        <Trophy className="w-6 h-6 sm:w-16 sm:h-16" style={{ color: COLORS.accent }} />
        <h2
          className="font-black text-lg sm:text-5xl text-center"
          style={{
            color: COLORS.primary,
            fontFamily: "'Fredoka One', sans-serif",
          }}
        >
          VICTORY!
        </h2>
        <p className="text-center text-[0.65rem] sm:text-base leading-snug" style={{ color: COLORS.uiTextSecondary }}>
          You conquered all 20 levels and mastered the Aether!
        </p>
        <div className="text-center px-3 py-1 sm:px-10 sm:py-4 rounded-xl sm:rounded-2xl" style={{ background: 'rgba(255,158,0,0.12)' }}>
          <p className="text-[0.6rem] sm:text-sm mb-0.5 uppercase tracking-wider font-semibold" style={{ color: COLORS.uiTextSecondary }}>Final Score</p>
          <p className="font-black text-lg sm:text-4xl" style={{ color: COLORS.accent }}>{score.toLocaleString()}</p>
        </div>
        <div className="w-full">
          <ActionButton icon={<Home className="w-3 h-3 sm:w-5 sm:h-5" />} label="MAIN MENU" color={COLORS.secondary} onClick={onMenu} />
        </div>
      </div>
    </div>
  );
}

// ==================== SENSITIVITY CONTROL ====================

export function SensitivityControl({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange: (val: number) => void;
  compact?: boolean;
}) {
  const presets = [
    { label: 'Low', val: 0.5 },
    { label: 'Norm', val: 1.5 },
    { label: 'High', val: 3.0 },
    { label: 'Max', val: 10.0 },
  ];

  return (
    <div
      className="w-full rounded-xl flex flex-col"
      style={{
        background: 'rgba(255,255,255,0.75)',
        padding: compact ? '7px 9px' : '10px 12px',
        gap: compact ? 4 : 7,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5" style={{ color: COLORS.primary }}>
          <Zap size={compact ? 13 : 16} style={{ color: COLORS.accent }} />
          <span className="font-bold" style={{ fontSize: compact ? '0.68rem' : '0.8rem' }}>Sensitivity</span>
        </div>
        <span
          className="font-extrabold rounded-lg"
          style={{
            background: 'rgba(90,24,154,0.12)',
            color: COLORS.primary,
            fontSize: compact ? '0.63rem' : '0.75rem',
            padding: '1px 7px',
          }}
        >
          {value.toFixed(2)}x
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span style={{ color: COLORS.primary, fontSize: '0.55rem', opacity: 0.5 }}>0.01</span>
        <input
          type="range"
          min="0.01"
          max="10.0"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: COLORS.secondary, height: compact ? 3 : 5 }}
        />
        <span style={{ color: COLORS.primary, fontSize: '0.55rem', opacity: 0.5 }}>10</span>
      </div>

      <div className="flex items-center gap-1">
        {presets.map((preset) => {
          const isActive = Math.abs(value - preset.val) < 0.1;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.val)}
              className="flex-1 rounded-lg font-bold transition-all"
              style={{
                background: isActive ? COLORS.secondary : 'rgba(0,0,0,0.07)',
                color: isActive ? '#FFFFFF' : COLORS.primary,
                fontSize: compact ? '0.56rem' : '0.63rem',
                padding: compact ? '2px 0' : '3px 0',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== SETTINGS SCREEN ====================

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState(getSettings());

  const toggleSound = () => {
    const next = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(next);
    saveSettings(next);
    gameAudio.updateSettings();
  };

  const toggleMusic = () => {
    const next = { ...settings, musicEnabled: !settings.musicEnabled };
    setSettings(next);
    saveSettings(next);
    gameAudio.updateSettings();
  };

  const handleSensitivityChange = (val: number) => {
    const next = { ...settings, paddleSensitivity: val };
    setSettings(next);
    saveSettings(next);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure? This will erase all progress and high scores.')) {
      resetAllData();
      setSettings(getSettings());
    }
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden flex flex-col justify-center"
      style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}
    >
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-5 px-2.5 sm:px-10 pt-2 sm:pt-8 pb-1 sm:pb-5 max-w-md w-full mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1 sm:py-2.5 rounded-lg sm:rounded-2xl transition-all active:scale-95 hover:bg-white shadow-sm hover:shadow-md"
          style={{ background: 'rgba(255,255,255,0.85)', color: COLORS.primary, fontWeight: 800 }}
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          <span className="text-xs sm:text-sm tracking-wide">Back</span>
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <Settings className="w-4 h-4 sm:w-8 sm:h-8" style={{ color: COLORS.secondary }} />
          <h2
            className="font-black text-sm sm:text-3xl"
            style={{
              color: COLORS.primary,
              fontFamily: "'Fredoka One', sans-serif",
            }}
          >
            Settings
          </h2>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-2.5 sm:px-10 pb-3 sm:pb-10 max-w-md w-full mx-auto my-auto">
        <div className="flex flex-col gap-2.5 sm:gap-5 p-0 sm:p-6 sm:bg-white/40 sm:backdrop-blur-md sm:rounded-3xl sm:shadow-lg">
          <SensitivityControl value={settings.paddleSensitivity} onChange={handleSensitivityChange} />

          <SettingsToggle
            icon={settings.soundEnabled ? <Volume2 className="w-4 h-4 sm:w-6 sm:h-6" /> : <VolumeX className="w-4 h-4 sm:w-6 sm:h-6" />}
            label="Sound Effects"
            enabled={settings.soundEnabled}
            onToggle={toggleSound}
          />

          <SettingsToggle
            icon={<Music className="w-4 h-4 sm:w-6 sm:h-6" />}
            label="Music"
            enabled={settings.musicEnabled}
            onToggle={toggleMusic}
          />

          <div className="mt-2 sm:mt-6 pt-3 sm:pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <p className="mb-1.5 sm:mb-3 font-bold text-xs sm:text-sm uppercase tracking-wider" style={{ color: COLORS.uiTextSecondary }}>Data Management</p>
            <button
              onClick={handleReset}
              className="w-full rounded-xl sm:rounded-2xl font-black text-white transition-all active:scale-95 py-2 sm:py-4 px-4 sm:px-6 text-xs sm:text-sm hover:opacity-90 shadow-sm hover:shadow-md"
              style={{ background: '#FF4D6D' }}
            >
              Reset All Data
            </button>
            <p className="mt-1 sm:mt-2 opacity-60 text-[0.6rem] sm:text-xs font-semibold" style={{ color: COLORS.uiTextSecondary }}>
              This will delete all progress and saves.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsToggle({ icon, label, enabled, onToggle }: { icon: React.ReactNode; label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full rounded-xl sm:rounded-2xl transition-all active:scale-95 p-2.5 sm:p-4 hover:sm:shadow-md"
      style={{ background: 'rgba(255,255,255,0.85)' }}
    >
      <div className="flex items-center gap-2 sm:gap-3" style={{ color: COLORS.primary }}>
        {icon}
        <span className="font-bold text-xs sm:text-base">{label}</span>
      </div>
      <div
        className="w-9 h-5 sm:w-12 sm:h-7 rounded-full relative transition-all"
        style={{ background: enabled ? COLORS.secondary : 'rgba(0,0,0,0.15)' }}
      >
        <div
          className="absolute top-0.5 sm:top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow transition-all"
          style={{ left: enabled ? (window.innerWidth >= 640 ? 24 : 17) : 2 }}
        />
      </div>
    </button>
  );
}

// ==================== ACTION BUTTON ====================

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

function ActionButton({ icon, label, color, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-1.5 sm:gap-3.5 w-full rounded-lg sm:rounded-2xl font-black text-white transition-all active:scale-95 hover:sm:scale-[1.02] hover:sm:shadow-lg py-1.5 sm:py-4 px-3 sm:px-8 text-[0.72rem] sm:text-base tracking-wider uppercase"
      style={{
        background: color,
        boxShadow: `0 4px 14px ${color}35`,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ==================== CSS ANIMATIONS ====================

export function MenuStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800;900&display=swap');

      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-12px) rotate(180deg); }
      }

      @keyframes titlePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }

      @keyframes confettiFall {
        0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }

      .cursor-none {
        cursor: none !important;
      }
    `}</style>
  );
}
