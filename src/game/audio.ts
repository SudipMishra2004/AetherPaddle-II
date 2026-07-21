// ============================================================
// AetherPaddle II - Web Audio API Synthesizer (No Asset Dependencies)
// ============================================================

import { getSettings } from './storage';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private musicOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private currentChordIndex = 0;
  private musicInterval: any = null;
  private isMusicPlaying = false;

  // Modern Retro-Synthwave Chords (Am, F, C, G)
  private readonly chords = [
    [220, 261.63, 329.63, 392.00], // Am7 (A2, C4, E4, G4)
    [174.61, 261.63, 349.23, 392.00], // Fmaj7 (F2, C4, F4, G4)
    [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C3, E4, G4, B4)
    [196.00, 293.66, 392.00, 440.00], // Gadd9 (G2, D4, G4, A4)
  ];

  constructor() {
    // Audio Context is initialized lazily on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Trigger sound effect
  playSfx(type: 'bounce' | 'brickHit' | 'brickBreak' | 'powerUp' | 'lifeLost' | 'victory' | 'gameOver' | 'laser') {
    const settings = getSettings();
    if (!settings.soundEnabled) return;

    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'bounce': {
        // High-pitched retro bounce ping
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case 'brickHit': {
        // Short, lower-pitched impact
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.06);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'brickBreak': {
        // Satisfying, noisy breaking explosion
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const biquad = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);

        biquad.type = 'lowpass';
        biquad.frequency.setValueAtTime(600, now);
        biquad.frequency.linearRampToValueAtTime(100, now + 0.2);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(biquad);
        biquad.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }

      case 'powerUp': {
        // Happy, rising chime arpeggio
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major triad
        notes.forEach((freq, index) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const noteTime = now + index * 0.07;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0, now);
          gain.gain.setValueAtTime(0.15, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.22);
        });
        break;
      }

      case 'lifeLost': {
        // Sad, descending sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
        break;
      }

      case 'victory': {
        // Triumphant level-completion retro progression
        const notes = [440, 554.37, 659.25, 880]; // A major
        notes.forEach((freq, index) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          const noteTime = now + index * 0.12;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.18, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.42);
        });
        break;
      }

      case 'gameOver': {
        // Slow, dramatic descending square pitch drop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.95);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.0);
        break;
      }

      case 'laser': {
        // Sci-Fi pew pew laser effect
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
    }
  }

  // Start background retro-synthwave ambient loop
  startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.currentChordIndex = 0;
    this.playChordSequence();

    // Change chords every 4 seconds
    this.musicInterval = setInterval(() => {
      this.playChordSequence();
    }, 4000);
  }

  // Play a soft, atmospheric lowpass-filtered retro pad chord
  private playChordSequence() {
    const settings = getSettings();
    if (!settings.musicEnabled || !this.ctx || this.ctx.state === 'suspended') {
      this.stopChordNodes();
      return;
    }

    const now = this.ctx.currentTime;
    const chord = this.chords[this.currentChordIndex];

    // Fade out previous notes gently
    this.stopChordNodes(0.5);

    // Create a new set of oscillators for this chord
    chord.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft, analog-like triangle/sine combo
      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Lowpass filter to keep it ambient and pad-like (non-distracting)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);

      // Fade-in (attack) to prevent sharp pops
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.8); // low ambient volume (3.5%)

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      this.musicOscs.push({ osc, gain });
    });

    this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
  }

  private stopChordNodes(fadeTime = 0.1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    this.musicOscs.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);
        osc.stop(now + fadeTime + 0.05);
      } catch {
        // Already stopped
      }
    });
    this.musicOscs = [];
  }

  // Stop background music
  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.stopChordNodes(0.4);
  }

  // Handle Settings updates (mute/unmute on the fly)
  updateSettings() {
    const settings = getSettings();
    if (!settings.musicEnabled) {
      this.stopChordNodes(0.2);
    } else if (this.isMusicPlaying && this.musicOscs.length === 0) {
      // Resume chord sequence if it was muted
      this.playChordSequence();
    }
  }
}

export const gameAudio = new AudioSynthesizer();
