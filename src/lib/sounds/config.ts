// src/lib/sounds/config.ts
// Centralized sound configuration - add new sounds here

export const SOUNDS = {
  // UI Sounds
  click: {
    path: "/sounds/click_001.ogg",
    volume: 0.5,
    loop: false,
  },
  questionStart: {
    path: "/sounds/click_001.ogg",
    volume: 0.5,
    loop: false,
  },
  countdown: {
    path: "/sounds/click_001.ogg",
    volume: 0.5,
    loop: false,
  },
  correct: {
    path: "/sounds/click_001.ogg",
    volume: 0.6,
    loop: false,
  },
  wrong: {
    path: "/sounds/click_001.ogg",
    volume: 0.6,
    loop: false,
  },
  gameOver: {
    path: "/sounds/click_001.ogg",
    volume: 0.7,
    loop: false,
  },
  nextQuestion: {
    path: "/sounds/click_001.ogg",
    volume: 0.5,
    loop: false,
  },
  roundBreak: {
    path: "/sounds/click_001.ogg",
    volume: 0.4,
    loop: true,
  },
} as const;

export type SoundName = keyof typeof SOUNDS;

