/**
 * Audio Chime and Browser Notification Utilities
 * Synthesizes crisp bell chimes via Web Audio API (no external mp3 files required)
 * and interfaces with the HTML5 Desktop Notification API.
 */

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;

  public getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Plays a synthesized chime tone
   */
  public play(type: 'success' | 'admin' | 'alert' | 'bell' = 'success') {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'admin') {
        // High-clarity 2-tone alert for Admin Console (587.33 Hz D5 -> 880 Hz A5)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);

        // Echo harmonic
        setTimeout(() => {
          try {
            const ctx2 = this.getAudioContext();
            if (!ctx2) return;
            const now2 = ctx2.currentTime;
            const osc2 = ctx2.createOscillator();
            const gain2 = ctx2.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(880, now2);
            osc2.frequency.setValueAtTime(1174.66, now2 + 0.08);

            gain2.gain.setValueAtTime(0.0001, now2);
            gain2.gain.linearRampToValueAtTime(0.18, now2 + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.35);

            osc2.connect(gain2);
            gain2.connect(ctx2.destination);
            osc2.start(now2);
            osc2.stop(now2 + 0.38);
          } catch {}
        }, 140);
      } else if (type === 'success') {
        // Cheerful 3-note ascending triad for driver booking confirmation (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const delay = idx * 0.09;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + delay);

          gain.gain.setValueAtTime(0.0001, now + delay);
          gain.gain.linearRampToValueAtTime(0.22, now + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.3);
        });
      } else {
        // Single crisp attention bell
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(783.99, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.48);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Request Desktop Browser Notification permission
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const perm = await Notification.requestPermission();
      return perm;
    } catch {
      return 'denied';
    }
  }

  /**
   * Display native desktop browser notification
   */
  public showDesktopNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=128&auto=format&fit=crop&q=80',
          ...options,
        });
      } catch {}
    }
  }
}

export const soundManager = new SoundManager();

// Automatically resume Web Audio context on the first user interaction anywhere in the window
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    soundManager.getAudioContext()?.resume().catch(() => {});
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}
