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
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: 8 + Math.random() * 16,
              height: 8 + Math.random() * 16,
              background: COLORS.primary,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 6}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Game Title */}
      <div className="mb-4 text-center relative z-10">
        <h1
          className="text-7xl font-black tracking-tight mb-2"
          style={{
            fontFamily: "'Fredoka One', 'Nunito', sans-serif",
            color: COLORS.primary,
            textShadow: `0 4px 0 ${COLORS.secondary}, 0 8px 20px rgba(90, 24, 154, 0.3)`,
            animation: 'titlePulse 3s ease-in-out infinite',
          }}
        >
          AetherPaddle
        </h1>
        <span
          className="text-4xl font-bold"
          style={{
            fontFamily: "'Fredoka One', sans-serif",
            color: COLORS.accent,
            textShadow: `0 2px 0 rgba(255, 158, 0, 0.3)`,
          }}
        >
          II
        </span>
      </div>

      <p className="text-lg mb-10 font-medium" style={{ color: COLORS.uiTextSecondary }}>
        Physics-Based Arcade Challenge
      </p>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-4 w-72 relative z-10">
        {hasSave && (
          <MenuButton
            icon={<Play size={22} />}
            label="CONTINUE"
            sublabel="Resume your journey"
            color={COLORS.secondary}
            hoverColor={COLORS.primary}
            onClick={onContinueGame}
            isHovered={hoveredBtn === 'continue'}
            onHover={() => setHoveredBtn('continue')}
            onLeave={() => setHoveredBtn(null)}
          />
        )}

        <MenuButton
          icon={<ChevronRight size={22} />}
          label="NEW GAME"
          sublabel="Start fresh"
          color={COLORS.accent}
          hoverColor="#E8890A"
          onClick={onStartGame}
          isHovered={hoveredBtn === 'newgame'}
          onHover={() => setHoveredBtn('newgame')}
          onLeave={() => setHoveredBtn(null)}
        />

        <MenuButton
          icon={<HelpCircle size={22} />}
          label="HOW TO PLAY"
          sublabel="Learn the mechanics"
          color={COLORS.uiTextSecondary}
          hoverColor={COLORS.primary}
          onClick={onOpenTutorial}
          isHovered={hoveredBtn === 'tutorial'}
          onHover={() => setHoveredBtn('tutorial')}
          onLeave={() => setHoveredBtn(null)}
        />



        <MenuButton
          icon={<Settings size={22} />}
          label="SETTINGS"
          sublabel="Audio & more"
          color={COLORS.uiTextSecondary}
          hoverColor={COLORS.primary}
          onClick={onOpenSettings}
          isHovered={hoveredBtn === 'settings'}
          onHover={() => setHoveredBtn('settings')}
          onLeave={() => setHoveredBtn(null)}
        />
      </div>

      {/* Version */}
      <p className="absolute bottom-4 text-xs opacity-40" style={{ color: COLORS.uiTextPrimary }}>
        v2.0.0 — Move mouse to control paddle
      </p>
    </div>
  );
}

// ==================== MENU BUTTON ====================

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color: string;
  hoverColor: string;
  onClick: () => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function MenuButton({ icon, label, sublabel, color, hoverColor, onClick, isHovered, onHover, onLeave }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 w-full text-left"
      style={{
        background: isHovered ? hoverColor : 'rgba(255, 255, 255, 0.6)',
        color: isHovered ? '#FFFFFF' : color,
        transform: isHovered ? 'translateX(8px) scale(1.02)' : 'translateX(0) scale(1)',
        boxShadow: isHovered
          ? `0 8px 24px ${hoverColor}40`
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-base leading-tight">{label}</div>
        {sublabel && (
          <div className="text-xs opacity-60 mt-0.5">{sublabel}</div>
        )}
      </div>
      <ChevronRight size={16} className="flex-shrink-0 opacity-40" />
    </button>
  );
}

// ==================== TUTORIAL SCREEN ====================

interface TutorialScreenProps {
  onBack: () => void;
}

export function TutorialScreen({ onBack }: TutorialScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8" style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}>
      <div className="max-w-2xl w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl transition-all hover:translate-x-[-4px]"
          style={{ background: 'rgba(255,255,255,0.6)', color: COLORS.primary }}
        >
          <ArrowLeft size={18} />
          <span className="font-semibold">Back</span>
        </button>

        <h2 className="text-4xl font-black mb-8" style={{ color: COLORS.primary, fontFamily: "'Fredoka One', sans-serif" }}>
          How to Play
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TutorialCard
            icon={<Zap size={28} />}
            title="Control the Paddle"
            description="Move your mouse horizontally to control the paddle. The ball bounces off it to hit bricks above."
            color={COLORS.accent}
          />
          <TutorialCard
            icon={<Star size={28} />}
            title="Destroy Bricks"
            description="Hit bricks with the ball to destroy them. Multi-hit bricks show their remaining HP and change color when damaged."
            color={COLORS.secondary}
          />
          <TutorialCard
            icon={<Shield size={28} />}
            title="Collect Power-Ups"
            description="Destroy special bricks to drop power-ups. Catch them with your paddle for temporary buffs like speed boost or shield."
            color={COLORS.shield}
          />
          <TutorialCard
            icon={<Trophy size={28} />}
            title="Advance Levels"
            description="Clear all breakable bricks to complete the level and advance to the next stage."
            color="#FF006E"
          />
        </div>

        <div className="mt-8 p-6 rounded-2xl max-h-[220px] overflow-y-auto" style={{ background: 'rgba(90, 24, 154, 0.08)' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.primary }}>Power-Up Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <PowerUpGuide type="HyperBounce" desc="Ball speed +50%" />
            <PowerUpGuide type="Magnetism" desc="Attract ball" />
            <PowerUpGuide type="AetherShield" desc="Bottom shield" />
            <PowerUpGuide type="TimeWarp" desc="Freeze time 2s" />
            <PowerUpGuide type="GrowPaddle" desc="Larger paddle" />
            <PowerUpGuide type="ShrinkPaddle" desc="Smaller paddle" />
            <PowerUpGuide type="SpeedUpBall" desc="Fast ball" />
            <PowerUpGuide type="SlowDownBall" desc="Slow ball" />
            <PowerUpGuide type="ChaosZone" desc="Danger buff!" />
            <PowerUpGuide type="BlastRadius" desc="Exploding hits" />
            <PowerUpGuide type="LaserPaddle" desc="Shoot lasers!" />
            <PowerUpGuide type="Multiball" desc="3 balls!" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TutorialCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: 'rgba(255, 255, 255, 0.7)', borderLeft: `4px solid ${color}` }}>
      <div className="flex items-center gap-3 mb-2" style={{ color }}>
        {icon}
        <h3 className="font-bold text-lg" style={{ color: COLORS.primary }}>{title}</h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: COLORS.uiTextSecondary }}>{description}</p>
    </div>
  );
}

function PowerUpGuide({ type, desc }: { type: PowerUpType; desc: string }) {
  const icon = POWERUP.icons[type];
  
  let fallbackSymbol = '';
  if (type === 'GrowPaddle') fallbackSymbol = '↔';
  else if (type === 'ShrinkPaddle') fallbackSymbol = '→←';
  else if (type === 'SpeedUpBall') fallbackSymbol = '⚡';
  else if (type === 'SlowDownBall') fallbackSymbol = '⏳';
  else if (type === 'ChaosZone') fallbackSymbol = '☠';
  else if (type === 'BlastRadius') fallbackSymbol = '💥';
  else if (type === 'LaserPaddle') fallbackSymbol = '🔫';
  else if (type === 'Multiball') fallbackSymbol = '⚪⚪';

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
      {icon ? (
        <img src={icon} alt={type} className="w-12 h-12 object-contain" />
      ) : (
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2" 
          style={{ 
            background: POWERUP.colors[type], 
            borderColor: 'rgba(255, 255, 255, 0.8)',
            color: '#10002B',
            boxShadow: `0 0 10px ${POWERUP.colors[type]}`
          }}
        >
          {fallbackSymbol}
        </div>
      )}
      <span className="text-xs font-bold text-center" style={{ color: POWERUP.colors[type] }}>{POWERUP.labels[type]}</span>
      <span className="text-xs text-center" style={{ color: COLORS.uiTextSecondary }}>{desc}</span>
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

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(60, 9, 108, 0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="flex flex-col items-center gap-6 p-10 rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.95)', minWidth: 320, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <Pause size={48} style={{ color: COLORS.primary }} />
        <h2 className="text-3xl font-black" style={{ color: COLORS.primary, fontFamily: "'Fredoka One', sans-serif" }}>
          PAUSED
        </h2>

        {state && (
          <div className="text-center space-y-1 mb-2">
            <p className="text-sm font-semibold" style={{ color: COLORS.uiTextSecondary }}>
              Level {state.level}: {LEVEL_CONFIGS[state.level - 1]?.name}
            </p>
            <p className="text-lg font-bold" style={{ color: COLORS.accent }}>
              Score: {state.score.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: state.lives }).map((_, i) => (
                <Heart key={i} size={16} fill={COLORS.heartFull} color={COLORS.heartFull} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 w-full">
          <ActionButton icon={<Play size={20} />} label="RESUME" color={COLORS.secondary} onClick={onResume} />
          <ActionButton icon={<RotateCcw size={20} />} label="RESTART LEVEL" color={COLORS.accent} onClick={onRestart} />
          <ActionButton icon={<Home size={20} />} label="QUIT TO MENU" color="#888" onClick={onQuit} />
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
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(60, 9, 108, 0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="flex flex-col items-center gap-5 p-10 rounded-3xl max-w-md w-full mx-4" style={{ background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h2
          className="text-5xl font-black"
          style={{
            color: '#FF4D6D',
            fontFamily: "'Fredoka One', sans-serif",
            textShadow: '0 2px 0 rgba(255, 77, 109, 0.3)',
          }}
        >
          GAME OVER
        </h2>

        {isNewBest && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: COLORS.accent + '20' }}>
            <Star size={18} fill={COLORS.accent} color={COLORS.accent} />
            <span className="font-bold text-sm" style={{ color: COLORS.accent }}>NEW BEST SCORE!</span>
          </div>
        )}

        <div className="text-center space-y-2 w-full py-4" style={{ borderTop: '1px solid rgba(0,0,0,0.1)', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: COLORS.uiTextSecondary }}>Final Score</span>
            <span className="text-2xl font-black" style={{ color: COLORS.primary }}>{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: COLORS.uiTextSecondary }}>Level Reached</span>
            <span className="font-bold" style={{ color: COLORS.secondary }}>{level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: COLORS.uiTextSecondary }}>Best Score</span>
            <span className="font-bold" style={{ color: COLORS.accent }}>{bestScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <ActionButton icon={<RotateCcw size={20} />} label="TRY AGAIN" color={COLORS.secondary} onClick={onRestart} />
          <ActionButton icon={<Home size={20} />} label="MAIN MENU" color="#888" onClick={onMenu} />
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
    <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(90, 24, 154, 0.85)', backdropFilter: 'blur(6px)' }}>
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: 8 + Math.random() * 8,
              height: 8 + Math.random() * 8,
              background: [COLORS.accent, COLORS.secondary, '#FF006E', COLORS.shield][i % 4],
              left: `${Math.random() * 100}%`,
              top: `-20px`,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `confettiFall ${3 + Math.random() * 4}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-6 p-10 rounded-3xl max-w-md w-full mx-4 relative z-10" style={{ background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <Trophy size={64} style={{ color: COLORS.accent }} />

        <h2
          className="text-5xl font-black text-center"
          style={{
            color: COLORS.primary,
            fontFamily: "'Fredoka One', sans-serif",
          }}
        >
          VICTORY!
        </h2>

        <p className="text-center text-lg" style={{ color: COLORS.uiTextSecondary }}>
          You have conquered all 20 levels and mastered the Aether!
        </p>

        <div className="text-center py-4 px-8 rounded-2xl" style={{ background: 'rgba(255, 158, 0, 0.1)' }}>
          <p className="text-sm mb-1" style={{ color: COLORS.uiTextSecondary }}>Final Score</p>
          <p className="text-4xl font-black" style={{ color: COLORS.accent }}>{score.toLocaleString()}</p>
        </div>

        <ActionButton icon={<Home size={20} />} label="MAIN MENU" color={COLORS.secondary} onClick={onMenu} />
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

  const handleReset = () => {
    if (window.confirm('Are you sure? This will erase all progress and high scores.')) {
      resetAllData();
      setSettings(getSettings());
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6" style={{ background: `linear-gradient(135deg, ${COLORS.background} 0%, #B8F0BE 100%)` }}>
      <div className="max-w-md w-full">
        <button
          onClick={onBack}
          className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl transition-all hover:translate-x-[-4px]"
          style={{ background: 'rgba(255,255,255,0.6)', color: COLORS.primary }}
        >
          <ArrowLeft size={18} />
          <span className="font-semibold">Back</span>
        </button>

        <div className="flex items-center gap-3 mb-8">
          <Settings size={32} style={{ color: COLORS.secondary }} />
          <h2 className="text-3xl font-black" style={{ color: COLORS.primary, fontFamily: "'Fredoka One', sans-serif" }}>
            Settings
          </h2>
        </div>

        <div className="space-y-4">
          <SettingsToggle
            icon={settings.soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
            label="Sound Effects"
            enabled={settings.soundEnabled}
            onToggle={toggleSound}
          />

          <SettingsToggle
            icon={<Music size={22} />}
            label="Music"
            enabled={settings.musicEnabled}
            onToggle={toggleMusic}
          />
        </div>

        <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}>
          <p className="text-sm mb-4 font-semibold" style={{ color: COLORS.uiTextSecondary }}>Data Management</p>
          <button
            onClick={handleReset}
            className="w-full px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: '#FF4D6D' }}
          >
            Reset All Data
          </button>
          <p className="text-xs mt-2 opacity-50" style={{ color: COLORS.uiTextSecondary }}>
            This will delete all progress and saves.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsToggle({ icon, label, enabled, onToggle }: { icon: React.ReactNode; label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-5 py-4 rounded-2xl transition-all"
      style={{ background: 'rgba(255, 255, 255, 0.7)' }}
    >
      <div className="flex items-center gap-3" style={{ color: COLORS.primary }}>
        {icon}
        <span className="font-bold">{label}</span>
      </div>
      <div
        className="w-12 h-7 rounded-full relative transition-all"
        style={{ background: enabled ? COLORS.secondary : 'rgba(0,0,0,0.15)' }}
      >
        <div
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all"
          style={{ left: enabled ? 24 : 4 }}
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
      className="flex items-center justify-center gap-3 w-full px-6 py-3.5 rounded-xl font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
      style={{ background: color }}
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
        50% { transform: translateY(-20px) rotate(180deg); }
      }

      @keyframes titlePulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
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
