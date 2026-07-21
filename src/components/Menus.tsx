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
      className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center"
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

      <div className="relative z-10 w-full max-w-sm px-3 flex flex-col items-center" style={{ gap: 'clamp(6px, 1.5vh, 16px)' }}>
        {/* Game Title */}
        <div className="text-center">
          <h1
            className="font-black tracking-tight leading-none"
            style={{
              fontFamily: "'Fredoka One', 'Nunito', sans-serif",
              color: COLORS.primary,
              fontSize: 'clamp(1.5rem, 6.5vw, 3.5rem)',
              textShadow: `0 3px 0 ${COLORS.secondary}, 0 6px 16px rgba(90,24,154,0.25)`,
              animation: 'titlePulse 3s ease-in-out infinite',
            }}
          >
            AetherPaddle{' '}
            <span
              style={{
                fontFamily: "'Fredoka One', sans-serif",
                color: COLORS.accent,
                fontSize: 'clamp(1.1rem, 5vw, 2.8rem)',
                textShadow: `0 2px 0 rgba(255,158,0,0.3)`,
              }}
            >
              II
            </span>
          </h1>
          <p
            className="font-semibold"
            style={{
              color: COLORS.uiTextSecondary,
              fontSize: 'clamp(0.55rem, 1.8vw, 0.85rem)',
              marginTop: 2,
            }}
          >
            Physics-Based Arcade Challenge
          </p>
        </div>

        {/* Menu Buttons — always 2 columns */}
        <div className="grid grid-cols-2 w-full" style={{ gap: 'clamp(5px, 1.2vw, 10px)' }}>
          {hasSave && (
            <MenuButton
              icon={<Play size={14} />}
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
            icon={<ChevronRight size={14} />}
            label="NEW GAME"
            color={COLORS.accent}
            hoverColor="#E8890A"
            onClick={onStartGame}
            isHovered={hoveredBtn === 'newgame'}
            onHover={() => setHoveredBtn('newgame')}
            onLeave={() => setHoveredBtn(null)}
          />

          <MenuButton
            icon={<HelpCircle size={14} />}
            label="HOW TO PLAY"
            color={COLORS.uiTextSecondary}
            hoverColor={COLORS.primary}
            onClick={onOpenTutorial}
            isHovered={hoveredBtn === 'tutorial'}
            onHover={() => setHoveredBtn('tutorial')}
            onLeave={() => setHoveredBtn(null)}
          />

          <MenuButton
            icon={<Settings size={14} />}
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
          className="opacity-40 text-center"
          style={{ color: COLORS.uiTextPrimary, fontSize: '0.55rem' }}
        >
          v2.0.0 · Touch & drag to play
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
      className="flex items-center justify-center gap-1.5 w-full rounded-xl font-bold transition-all duration-150 active:scale-95"
      style={{
        padding: 'clamp(5px, 1.3vh, 11px) 6px',
        background: isHovered ? hoverColor : 'rgba(255,255,255,0.78)',
        color: isHovered ? '#FFFFFF' : color,
        boxShadow: isHovered ? `0 4px 14px ${hoverColor}40` : '0 2px 6px rgba(0,0,0,0.08)',
        fontSize: 'clamp(0.58rem, 1.8vw, 0.78rem)',
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-black tracking-wide truncate">{label}</span>
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
      {/* Fixed header — always visible */}
      <div className="flex-shrink-0 flex items-center gap-2 px-2.5 pt-1.5 pb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.8)', color: COLORS.primary, fontSize: '0.75rem', fontWeight: 700 }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <h2
          className="font-black"
          style={{
            color: COLORS.primary,
            fontFamily: "'Fredoka One', sans-serif",
            fontSize: 'clamp(0.9rem, 3vw, 1.6rem)',
          }}
        >
          How to Play
        </h2>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2">
        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
          <TutorialCard
            icon={<Zap size={14} />}
            title="Control"
            description="Touch & drag left/right to move the paddle."
            color={COLORS.accent}
          />
          <TutorialCard
            icon={<Star size={14} />}
            title="Bricks"
            description="Hit bricks with the ball. Multi-hit bricks show HP."
            color={COLORS.secondary}
          />
          <TutorialCard
            icon={<Shield size={14} />}
            title="Power-Ups"
            description="Catch dropped power-ups for temporary buffs."
            color={COLORS.shield}
          />
          <TutorialCard
            icon={<Trophy size={14} />}
            title="Advance"
            description="Clear all bricks to advance to the next level."
            color="#FF006E"
          />
        </div>

        <div className="p-2 rounded-xl" style={{ background: 'rgba(90,24,154,0.08)' }}>
          <h3 className="font-bold mb-1.5" style={{ color: COLORS.primary, fontSize: 'clamp(0.65rem, 2vw, 0.85rem)' }}>
            Power-Up Guide
          </h3>
          <div className="grid grid-cols-4 gap-1">
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
      className="rounded-xl"
      style={{
        background: 'rgba(255,255,255,0.78)',
        borderLeft: `3px solid ${color}`,
        padding: 'clamp(5px, 1.2vh, 10px) 8px',
      }}
    >
      <div className="flex items-center gap-1 mb-0.5" style={{ color }}>
        {icon}
        <h3 className="font-bold" style={{ color: COLORS.primary, fontSize: 'clamp(0.6rem, 1.8vw, 0.78rem)' }}>{title}</h3>
      </div>
      <p style={{ color: COLORS.uiTextSecondary, fontSize: 'clamp(0.5rem, 1.5vw, 0.68rem)', lineHeight: 1.35 }}>{description}</p>
    </div>
  );
}

function PowerUpGuide({ type, desc }: { type: PowerUpType; desc: string }) {
  const icon = POWERUP.icons[type];

  let fallbackSymbol = '';
  if (type === 'GrowPaddle') fallbackSymbol = '?';
  else if (type === 'ShrinkPaddle') fallbackSymbol = '??';
  else if (type === 'SpeedUpBall') fallbackSymbol = '?';
  else if (type === 'SlowDownBall') fallbackSymbol = '?';
  else if (type === 'ChaosZone') fallbackSymbol = '?';
  else if (type === 'BlastRadius') fallbackSymbol = '??';
  else if (type === 'LaserPaddle') fallbackSymbol = '??';
  else if (type === 'Multiball') fallbackSymbol = '?';

  return (
    <div
      className="flex flex-col items-center gap-0.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.6)', padding: '4px 2px' }}
    >
      {icon ? (
        <img src={icon} alt={type} className="w-6 h-6 object-contain" />
      ) : (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center border"
          style={{
            background: POWERUP.colors[type],
            borderColor: 'rgba(255,255,255,0.8)',
            color: '#10002B',
            fontSize: '0.55rem',
            fontWeight: 700,
          }}
        >
          {fallbackSymbol}
        </div>
      )}
      <span className="text-center leading-tight" style={{ color: POWERUP.colors[type], fontSize: '0.45rem', fontWeight: 700 }}>{POWERUP.labels[type]}</span>
      <span className="text-center leading-tight" style={{ color: COLORS.uiTextSecondary, fontSize: '0.42rem', opacity: 0.8 }}>{desc}</span>
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
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(60,9,108,0.82)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="flex flex-col items-center w-full mx-3"
        style={{
          maxWidth: 340,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 18,
          padding: 'clamp(8px, 2vh, 20px) clamp(10px, 2.5vw, 24px)',
          boxShadow: '0 14px 44px rgba(0,0,0,0.35)',
          gap: 'clamp(5px, 1.2vh, 12px)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Pause size={20} style={{ color: COLORS.primary }} />
          <h2
            className="font-black"
            style={{ color: COLORS.primary, fontFamily: "'Fredoka One', sans-serif", fontSize: 'clamp(1rem, 3.5vw, 1.6rem)' }}
          >
            PAUSED
          </h2>
        </div>

        {state && (
          <div className="text-center" style={{ lineHeight: 1.4 }}>
            <p style={{ color: COLORS.uiTextSecondary, fontSize: 'clamp(0.58rem, 1.8vw, 0.75rem)' }}>
              Level {state.level}: {LEVEL_CONFIGS[state.level - 1]?.name}
            </p>
            <p className="font-bold" style={{ color: COLORS.accent, fontSize: 'clamp(0.7rem, 2.2vw, 0.9rem)' }}>
              Score: {state.score.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              {Array.from({ length: state.lives }).map((_, i) => (
                <Heart key={i} size={12} fill={COLORS.heartFull} color={COLORS.heartFull} />
              ))}
            </div>
          </div>
        )}

        <div className="w-full">
          <SensitivityControl value={settings.paddleSensitivity} onChange={handleSensitivityChange} compact />
        </div>

        <div className="flex flex-col w-full" style={{ gap: 'clamp(4px, 1vh, 9px)' }}>
          <ActionButton icon={<Play size={15} />} label="RESUME" color={COLORS.secondary} onClick={onResume} />
          <ActionButton icon={<RotateCcw size={15} />} label="RESTART LEVEL" color={COLORS.accent} onClick={onRestart} />
          <ActionButton icon={<Home size={15} />} label="QUIT TO MENU" color="#888" onClick={onQuit} />
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
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(60,9,108,0.88)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="flex flex-col items-center w-full mx-3"
        style={{
          maxWidth: 340,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 18,
          padding: 'clamp(8px, 2vh, 20px) clamp(12px, 2.5vw, 24px)',
          boxShadow: '0 14px 44px rgba(0,0,0,0.35)',
          gap: 'clamp(5px, 1.2vh, 12px)',
        }}
      >
        <h2
          className="font-black"
          style={{
            color: '#FF4D6D',
            fontFamily: "'Fredoka One', sans-serif",
            fontSize: 'clamp(1.3rem, 5.5vw, 2.2rem)',
            textShadow: '0 2px 0 rgba(255,77,109,0.2)',
          }}
        >
          GAME OVER
        </h2>

        {isNewBest && (
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full" style={{ background: COLORS.accent + '22' }}>
            <Star size={12} fill={COLORS.accent} color={COLORS.accent} />
            <span className="font-bold" style={{ color: COLORS.accent, fontSize: '0.65rem' }}>NEW BEST SCORE!</span>
          </div>
        )}

        <div
          className="w-full"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.08)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            padding: 'clamp(5px, 1.2vh, 10px) 0',
          }}
        >
          {[
            { label: 'Final Score', value: score.toLocaleString(), valueStyle: { color: COLORS.primary, fontWeight: 900, fontSize: 'clamp(0.9rem, 3.5vw, 1.3rem)' } },
            { label: 'Level Reached', value: String(level), valueStyle: { color: COLORS.secondary, fontWeight: 700, fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)' } },
            { label: 'Best Score', value: bestScore.toLocaleString(), valueStyle: { color: COLORS.accent, fontWeight: 700, fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)' } },
          ].map(({ label, value, valueStyle }) => (
            <div key={label} className="flex justify-between items-center" style={{ marginBottom: 3 }}>
              <span style={{ color: COLORS.uiTextSecondary, fontSize: 'clamp(0.58rem, 1.8vw, 0.75rem)' }}>{label}</span>
              <span style={valueStyle}>{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col w-full" style={{ gap: 'clamp(4px, 1vh, 9px)' }}>
          <ActionButton icon={<RotateCcw size={15} />} label="TRY AGAIN" color={COLORS.secondary} onClick={onRestart} />
          <ActionButton icon={<Home size={15} />} label="MAIN MENU" color="#888" onClick={onMenu} />
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
      className="absolute inset-0 overflow-hidden flex items-center justify-center"
      style={{ background: 'rgba(90,24,154,0.9)', backdropFilter: 'blur(6px)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 5 + (i % 3) * 4,
              height: 5 + (i % 3) * 4,
              background: [COLORS.accent, COLORS.secondary, '#FF006E', COLORS.shield][i % 4],
              left: `${(i * 5.5) % 100}%`,
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
        className="flex flex-col items-center w-full mx-3 relative z-10"
        style={{
          maxWidth: 340,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 18,
          padding: 'clamp(10px, 2.5vh, 24px) clamp(12px, 2.5vw, 24px)',
          boxShadow: '0 14px 44px rgba(0,0,0,0.35)',
          gap: 'clamp(6px, 1.5vh, 14px)',
        }}
      >
        <Trophy size={36} style={{ color: COLORS.accent }} />
        <h2
          className="font-black text-center"
          style={{
            color: COLORS.primary,
            fontFamily: "'Fredoka One', sans-serif",
            fontSize: 'clamp(1.4rem, 5.5vw, 2.2rem)',
          }}
        >
          VICTORY!
        </h2>
        <p className="text-center" style={{ color: COLORS.uiTextSecondary, fontSize: 'clamp(0.6rem, 1.8vw, 0.8rem)' }}>
          You conquered all 20 levels!
        </p>
        <div className="text-center px-5 py-2 rounded-2xl" style={{ background: 'rgba(255,158,0,0.1)' }}>
          <p style={{ color: COLORS.uiTextSecondary, fontSize: '0.65rem', marginBottom: 2 }}>Final Score</p>
          <p className="font-black" style={{ color: COLORS.accent, fontSize: 'clamp(1.3rem, 5vw, 2rem)' }}>{score.toLocaleString()}</p>
        </div>
        <div className="w-full">
          <ActionButton icon={<Home size={15} />} label="MAIN MENU" color={COLORS.secondary} onClick={onMenu} />
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
      className="absolute inset-0 overflow-hidden flex flex-col"
      style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}
    >
      {/* Fixed header — always visible */}
      <div className="flex-shrink-0 flex items-center gap-2 px-2.5 pt-1.5 pb-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.8)', color: COLORS.primary, fontSize: '0.75rem', fontWeight: 700 }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <Settings size={18} style={{ color: COLORS.secondary }} />
          <h2
            className="font-black"
            style={{
              color: COLORS.primary,
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: 'clamp(0.9rem, 3vw, 1.6rem)',
            }}
          >
            Settings
          </h2>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-2">
        <div className="flex flex-col gap-1.5 max-w-md mx-auto">
          <SensitivityControl value={settings.paddleSensitivity} onChange={handleSensitivityChange} />

          <SettingsToggle
            icon={settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            label="Sound Effects"
            enabled={settings.soundEnabled}
            onToggle={toggleSound}
          />

          <SettingsToggle
            icon={<Music size={16} />}
            label="Music"
            enabled={settings.musicEnabled}
            onToggle={toggleMusic}
          />

          <div className="mt-1.5 pt-2.5" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <p className="mb-1.5 font-semibold" style={{ color: COLORS.uiTextSecondary, fontSize: '0.68rem' }}>Data Management</p>
            <button
              onClick={handleReset}
              className="w-full rounded-xl font-bold text-white transition-all active:scale-95"
              style={{ background: '#FF4D6D', padding: '7px 14px', fontSize: '0.78rem' }}
            >
              Reset All Data
            </button>
            <p className="mt-1 opacity-50" style={{ color: COLORS.uiTextSecondary, fontSize: '0.6rem' }}>
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
      className="flex items-center justify-between w-full rounded-xl transition-all active:scale-95"
      style={{ background: 'rgba(255,255,255,0.78)', padding: '8px 12px' }}
    >
      <div className="flex items-center gap-2" style={{ color: COLORS.primary }}>
        {icon}
        <span className="font-bold" style={{ fontSize: '0.8rem' }}>{label}</span>
      </div>
      <div
        className="w-9 h-5 rounded-full relative transition-all"
        style={{ background: enabled ? COLORS.secondary : 'rgba(0,0,0,0.15)' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
          style={{ left: enabled ? 17 : 2 }}
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
      className="flex items-center justify-center gap-2 w-full rounded-xl font-bold text-white transition-all active:scale-95 hover:opacity-90"
      style={{
        background: color,
        padding: 'clamp(6px, 1.6vh, 12px) 14px',
        fontSize: 'clamp(0.65rem, 2vw, 0.85rem)',
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
