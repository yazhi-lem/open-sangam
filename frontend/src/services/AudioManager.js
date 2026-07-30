/**
 * AudioManager — singleton class for fading and looping Tinai ambient nature sounds.
 * Integrates state caching via localStorage and event listeners to coordinate global mute states.
 */
class AudioManager {
  constructor() {
    this.currentTrack = null;
    this.currentTinai = null;
    this.isMuted = true; // Start muted by default to align with modern browser guidelines
    this.tracks = {};
    this.fadeIntervals = {};

    this.sources = {
      kurinji: 'https://www.soundjay.com/nature/sounds/waterfall-1.mp3',
      mullai: 'https://www.soundjay.com/nature/sounds/forest-wind-1.mp3',
      marutam: 'https://www.soundjay.com/nature/sounds/river-1.mp3',
      neytal: 'https://www.soundjay.com/nature/sounds/ocean-wave-1.mp3',
      palai: 'https://www.soundjay.com/nature/sounds/desert-wind-1.mp3',
    };

    this.listeners = new Set();
  }

  init() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sangam:audioMuted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Initialize listener with current mute state
    listener(this.isMuted);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const l of this.listeners) {
      try {
        l(this.isMuted);
      } catch (err) {
        console.error('Error triggering audio listener:', err);
      }
    }
  }

  setMute(muted) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sangam:audioMuted', String(muted));
    }

    if (this.currentTrack) {
      this.currentTrack.muted = muted;
      if (!muted) {
        this.currentTrack.play().catch((e) => {
          console.warn('Audio play request failed after user click:', e);
        });
      }
    }

    this.notify();
  }

  play(tinaiId) {
    if (!this.sources[tinaiId]) return;
    if (this.currentTinai === tinaiId) {
      if (this.currentTrack && !this.isMuted) {
        this.currentTrack.play().catch(() => {});
      }
      return;
    }

    const previousTrack = this.currentTrack;
    const nextSrc = this.sources[tinaiId];

    let nextTrack = this.tracks[tinaiId];
    if (!nextTrack) {
      nextTrack = new Audio(nextSrc);
      nextTrack.loop = true;
      nextTrack.volume = 0;
      nextTrack.muted = this.isMuted;
      this.tracks[tinaiId] = nextTrack;
    }

    this.currentTrack = nextTrack;
    this.currentTinai = tinaiId;

    // Start playing background video track
    nextTrack.play().catch((e) => {
      console.log('Audio autoplay deferred until interaction:', e);
    });

    this.fade(nextTrack, 0.35, 1200); // target standard comfortable ambient volume (35%)
    if (previousTrack) {
      this.fade(previousTrack, 0, 1200, () => {
        previousTrack.pause();
      });
    }
  }

  stopAll() {
    this.currentTinai = null;
    const previousTrack = this.currentTrack;
    this.currentTrack = null;
    if (previousTrack) {
      this.fade(previousTrack, 0, 800, () => {
        previousTrack.pause();
      });
    }
  }

  fade(audio, targetVolume, duration, onComplete) {
    const trackId = audio.src;
    if (this.fadeIntervals[trackId]) {
      clearInterval(this.fadeIntervals[trackId]);
    }

    const startVolume = audio.volume;
    const difference = targetVolume - startVolume;
    const stepTime = 50; // Milliseconds per update step
    const steps = duration / stepTime;
    const stepValue = difference / steps;
    let currentStep = 0;

    this.fadeIntervals[trackId] = setInterval(() => {
      currentStep++;
      const nextVol = Math.max(0, Math.min(1, startVolume + (stepValue * currentStep)));
      audio.volume = nextVol;

      if (currentStep >= steps) {
        clearInterval(this.fadeIntervals[trackId]);
        audio.volume = targetVolume;
        delete this.fadeIntervals[trackId];
        if (onComplete) onComplete();
      }
    }, stepTime);
  }
}

const audioManager = new AudioManager();
audioManager.init();
export default audioManager;
