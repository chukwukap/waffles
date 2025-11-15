export const PALETTES = [
  { bg: "#FFE8BA", border: "#FFC931", text: "#151515" },
  { bg: "#EFD6FF", border: "#B45CFF", text: "#151515" },
  { bg: "#D7EBFF", border: "#2E7DFF", text: "#151515" },
  { bg: "#D8FFF1", border: "#18DCA5", text: "#151515" },
] as const;

export const EXTRA_TIME_SECONDS = 3; // 3 seconds

export const SOUNDS = {
  background: {
    path: "/sounds/background.wav",
    volume: 0.5,
    loop: true,
  },
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
