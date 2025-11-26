/**
 * Shared game seed data
 * Reused by both prisma seed and game seed scripts
 *
 * Updated to match Prisma schema structure:
 * - Uses roundIndex instead of roundNum
 * - Uses content instead of text
 * - Uses mediaUrl instead of imageUrl
 * - Uses correctIndex (computed from correctAnswer)
 * - soundUrl kept for reference but not stored in DB
 */

// Question data structure matching Prisma schema
export interface QuestionData {
  content: string; // Question text
  mediaUrl: string; // Image/video URL
  soundUrl?: string; // Audio URL (for reference, not stored in DB)
  correctAnswer: string; // The correct answer text (used to compute correctIndex)
  options: string[]; // Array of answer options
}

// Round data structure
export interface RoundData {
  roundIndex: number; // Round number (1, 2, 3, etc.)
  questions: QuestionData[]; // Questions for this round
}

// Raw game questions data with relative URLs
const rawGameQuestions: RoundData[] = [
  // Round 1
  {
    roundIndex: 1,
    questions: [
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/godfather.jpg",
        soundUrl: "/sounds/scenes/godfather.mp3",
        correctAnswer: "The Godfather (1972)",
        options: [
          "On the Waterfront (1954)",
          "A Streetcar Named Desire (1951)",
          "The Freshman (1990)",
          "The Godfather (1972)",
        ],
      },
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/dune.jpg",
        soundUrl: "/sounds/scenes/dune.mp3",
        correctAnswer: "Dune (2021/2024)",
        options: [
          "Blade Runner 2049 (2017)",
          "Interstellar (2014)",
          "Lawrence of Arabia (1962)",
          "Dune (2021/2024)",
        ],
      },
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/dark-knight.jpg",
        soundUrl: "/sounds/scenes/dark-knight.mp3",
        correctAnswer: "The Dark Knight (2008)",
        options: [
          "American Psycho (2000)",
          "Joker (2019)",
          "No Country for Old Men (2007)",
          "The Dark Knight (2008)",
        ],
      },
    ],
  },
  // Round 2
  {
    roundIndex: 2,
    questions: [
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/wolf-of-wall-street.jpg",
        soundUrl: "/sounds/scenes/wolf-of-wall-street.mp3",
        correctAnswer: "The Wolf of Wall Street (2013)",
        options: [
          "Glengarry Glen Ross (1992)",
          "Boiler Room (2000)",
          "American Psycho (2000)",
          "The Wolf of Wall Street (2013)",
        ],
      },
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/social-network.jpg",
        soundUrl: "/sounds/scenes/social-network.mp3",
        correctAnswer: "The Social Network (2010)",
        options: [
          "Steve Jobs (2015)",
          "The Girl with the Dragon Tattoo (2011)",
          "Moneyball (2011)",
          "The Social Network (2010)",
        ],
      },
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/matrix.jpg",
        soundUrl: "/sounds/scenes/matrix.mp3",
        correctAnswer: "The Matrix (1999)",
        options: [
          "Dark City (1998)",
          "Inception (2010)",
          "Equilibrium (2002)",
          "The Matrix (1999)",
        ],
      },
    ],
  },
  // Round 3
  {
    roundIndex: 3,
    questions: [
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/breaking-bad.jpg",
        soundUrl: "/sounds/scenes/breaking-bad.mp3",
        correctAnswer: "Breaking Bad (2008-2013)",
        options: [
          "Better Call Saul (2015-2022)",
          "Ozark (2017-2022)",
          "The Sopranos (1999-2007)",
          "Breaking Bad (2008-2013)",
        ],
      },
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/got.jpg",
        soundUrl: "/sounds/scenes/got.mp3",
        correctAnswer: "Game of Thrones (2011-2019)",
        options: [
          "House of the Dragon (2022-Present)",
          "The Lord of the Rings: The Rings of Power (2022-Present)",
          "Vikings (2013-2020)",
          "Game of Thrones (2011-2019)",
        ],
      },
      {
        content: "Guess the movie",
        mediaUrl: "/images/scenes/stranger-things.jpg",
        soundUrl: "/sounds/scenes/stranger-things.mp3",
        correctAnswer: "Stranger Things (2016-Present)",
        options: [
          "Dark (2017-2020)",
          "It (2017/2019)",
          "The Umbrella Academy (2019-Present)",
          "Stranger Things (2016-Present)",
        ],
      },
    ],
  },
];

/**
 * Get game questions data
 * Returns rounds with questions matching the Prisma schema structure
 */
export const getGameQuestions = (): RoundData[] => {
  return rawGameQuestions;
};

/**
 * Helper function to compute correctIndex from correctAnswer
 * Finds the index of the correct answer in the options array
 */
export const getCorrectIndex = (
  correctAnswer: string,
  options: string[]
): number => {
  const index = options.findIndex((option) => option === correctAnswer);
  if (index === -1) {
    console.warn(
      `Correct answer "${correctAnswer}" not found in options. Defaulting to index 0.`
    );
    return 0;
  }
  return index;
};

/**
 * Export raw questions for backward compatibility
 * @deprecated Use getGameQuestions() instead
 */
export const gameQuestions = rawGameQuestions;

/**
 * Default game configuration
 * Maps to Prisma Game model fields
 */
export const defaultGameConfig = {
  entryFee: 50, // Maps to Game.entryFee
  roundDurationSec: 15, // Maps to Game.roundDurationSec
  maxPlayers: 200, // Maps to Game.maxPlayers
  prizePool: 0, // Maps to Game.prizePool
  theme: "MOVIES" as const, // Maps to Game.theme (GameTheme enum)
  // Legacy fields for backward compatibility
  ticketPrice: 50, // Alias for entryFee
  roundTimeLimit: 15, // Alias for roundDurationSec
  questionsPerGame: 9, // Alias for questionCount
  soundEnabled: false, // Not stored in schema, kept for reference
  scoreMultiplier: 1.0, // Not stored in schema, kept for reference
  scorePenalty: 0, // Not stored in schema, kept for reference
};
