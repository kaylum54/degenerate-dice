"use client";

import { useCallback, useEffect, useRef } from "react";

// Sound effect types
type SoundType = "bet" | "win" | "lose" | "tick" | "roundEnd" | "click" | "error" | "countdown";

// Create audio context lazily (browsers require user interaction first)
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Generate sounds using Web Audio API (no external files needed)
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3,
  attack: number = 0.01,
  decay: number = 0.1
) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // ADSR envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error("Sound error:", e);
  }
}

// Play a sequence of notes
function playSequence(notes: { freq: number; duration: number; delay: number }[], type: OscillatorType = "sine", volume: number = 0.3) {
  notes.forEach(({ freq, duration, delay }) => {
    setTimeout(() => playTone(freq, duration, type, volume), delay * 1000);
  });
}

// Sound definitions
const sounds: Record<SoundType, () => void> = {
  // Bet placed - coin drop sound (descending tones)
  bet: () => {
    playSequence([
      { freq: 1200, duration: 0.08, delay: 0 },
      { freq: 800, duration: 0.08, delay: 0.05 },
      { freq: 600, duration: 0.15, delay: 0.1 },
    ], "sine", 0.25);
  },

  // Win sound - triumphant ascending arpeggio
  win: () => {
    playSequence([
      { freq: 523, duration: 0.15, delay: 0 },      // C5
      { freq: 659, duration: 0.15, delay: 0.1 },    // E5
      { freq: 784, duration: 0.15, delay: 0.2 },    // G5
      { freq: 1047, duration: 0.4, delay: 0.3 },    // C6
    ], "sine", 0.3);
  },

  // Lose sound - descending minor
  lose: () => {
    playSequence([
      { freq: 400, duration: 0.2, delay: 0 },
      { freq: 350, duration: 0.2, delay: 0.15 },
      { freq: 300, duration: 0.4, delay: 0.3 },
    ], "triangle", 0.2);
  },

  // Tick sound - clock tick
  tick: () => {
    playTone(800, 0.05, "square", 0.15, 0.001, 0.01);
  },

  // Round end - dramatic chord
  roundEnd: () => {
    playSequence([
      { freq: 261, duration: 0.5, delay: 0 },   // C4
      { freq: 329, duration: 0.5, delay: 0 },   // E4
      { freq: 392, duration: 0.5, delay: 0 },   // G4
      { freq: 523, duration: 0.5, delay: 0 },   // C5
    ], "sine", 0.2);
  },

  // Click sound - UI feedback
  click: () => {
    playTone(600, 0.05, "sine", 0.15, 0.001, 0.02);
  },

  // Error sound - buzz
  error: () => {
    playSequence([
      { freq: 200, duration: 0.1, delay: 0 },
      { freq: 200, duration: 0.1, delay: 0.15 },
    ], "sawtooth", 0.2);
  },

  // Countdown warning - urgent beeps
  countdown: () => {
    playTone(880, 0.1, "square", 0.25, 0.01, 0.05);
  },
};

export function useSounds() {
  const enabledRef = useRef(true);
  const initializedRef = useRef(false);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (!initializedRef.current) {
      try {
        getAudioContext();
        initializedRef.current = true;
      } catch (e) {
        console.error("Failed to initialize audio:", e);
      }
    }
  }, []);

  // Enable sounds on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
      // Resume audio context if suspended
      if (audioContext?.state === "suspended") {
        audioContext.resume();
      }
    };

    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [initAudio]);

  const play = useCallback((sound: SoundType) => {
    if (enabledRef.current && initializedRef.current) {
      sounds[sound]();
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { play, setEnabled, initAudio };
}

// Singleton for use outside of React components
let globalSoundsEnabled = true;

export const playSound = (sound: SoundType) => {
  if (globalSoundsEnabled && typeof window !== "undefined") {
    sounds[sound]();
  }
};

export const setSoundsEnabled = (enabled: boolean) => {
  globalSoundsEnabled = enabled;
};
