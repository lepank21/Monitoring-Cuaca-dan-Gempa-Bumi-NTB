// Audio synthesis for Disaster Alert using standard Web Audio API
class SoundAlertManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Sound enabled by default, can be toggled by user
    const saved = localStorage.getItem('bmkg_sound_enabled');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(val: boolean) {
    this.soundEnabled = val;
    localStorage.setItem('bmkg_sound_enabled', String(val));
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

  // Play Emergency Alarm (e.g. for M >= 5.0 or Earthquake in NTB)
  public playEarthquakeAlert(magnitude: number = 5.0) {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Higher magnitude produces more urgent frequency modulation
      const baseFreq = magnitude >= 6.0 ? 880 : 660;

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      // 3 short alert pulses
      for (let i = 0; i < 3; i++) {
        const start = now + i * 0.35;
        osc1.frequency.setValueAtTime(baseFreq, start);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, start + 0.15);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq, start + 0.3);

        osc2.frequency.setValueAtTime(baseFreq * 0.5, start);
      }

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.15);
      osc2.stop(now + 1.15);
    } catch (err) {
      console.warn('Audio alert error:', err);
    }
  }

  // Play Weather Warning Chime (Two-tone alert)
  public playWeatherAlert() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.4); // G5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch (err) {
      console.warn('Audio alert error:', err);
    }
  }
}

export const soundAlert = new SoundAlertManager();
