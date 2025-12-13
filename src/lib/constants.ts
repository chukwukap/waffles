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
    volume: 0.1,
    loop: true,
  },
  click: {
    path: "/sounds/click.wav",
    volume: 0.5,
    loop: false,
  },
  questionStart: {
    path: "/sounds/question-start.wav",
    volume: 0.5,
    loop: false,
  },
  countdown: {
    path: "/sounds/countdown.wav",
    volume: 0.5,
    loop: false,
  },
  gameOver: {
    path: "/sounds/game-over.wav",
    volume: 0.7,
    loop: false,
  },
  nextQuestion: {
    path: "/sounds/next-question.wav",
    volume: 0.5,
    loop: false,
  },
  roundBreak: {
    path: "/sounds/round-break.wav",
    volume: 0.4,
    loop: true,
  },
} as const;

export type SoundName = keyof typeof SOUNDS;

export const USDC_ADDRESS_BASE_MAINNET =
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const WAFFLE_FID = 1386922;
