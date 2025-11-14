/**
 * Shared game seed data
 * Reused by both prisma seed and game seed scripts
 */

// Helper function to convert relative URLs to full URLs
const makeFullUrl = (baseUrl: string, path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path; // Already a full URL
  }
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBaseUrl}${cleanPath}`;
};

// Raw game questions data with relative URLs
const rawGameQuestions = [
  // Round 1
  {
    roundNum: 1,
    data: [
      {
        text: "Guess the movie",
        imageUrl: "/images/scenes/godfather.jpg",
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
        text: "Guess the movie",
        imageUrl: "/images/scenes/dune.jpg",
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
        text: "Guess the movie",
        imageUrl: "/images/scenes/dark-knight.jpg",
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
    roundNum: 2,
    data: [
      {
        text: "Guess the movie",
        imageUrl: "/images/scenes/wolf-of-wall-street.jpg",
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
        text: "Guess the movie",
        imageUrl: "/images/scenes/social-network.jpg",
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
        text: "Guess the movie",
        imageUrl: "/images/scenes/matrix.jpg",
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
    roundNum: 3,
    data: [
      {
        text: "Guess the movie",
        imageUrl: "/images/scenes/breaking-bad.jpg",
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
        text: "Guess the movie",
        imageUrl: "/images/scenes/got.jpg",
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
        text: "Guess the movie",
        imageUrl: "/images/scenes/stranger-things.jpg",
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
 * Get game questions with full URLs based on base URL
 * @param baseUrl - Base URL (e.g., "http://localhost:3000" or "https://example.com")
 */
export const getGameQuestions = (baseUrl: string) => {
  return rawGameQuestions.map((round) => ({
    roundNum: round.roundNum,
    data: round.data.map((q) => ({
      ...q,
      imageUrl: makeFullUrl(baseUrl, q.imageUrl),
      soundUrl: q.soundUrl ? makeFullUrl(baseUrl, q.soundUrl) : null,
    })),
  }));
};

/**
 * Export raw questions for backward compatibility (uses relative URLs)
 * @deprecated Use getGameQuestions() with baseUrl instead
 */
export const gameQuestions = rawGameQuestions;

export const defaultGameConfig = {
  ticketPrice: 50,
  roundTimeLimit: 15,
  questionsPerGame: 9,
  scoreMultiplier: 1.0,
  scorePenalty: 0,
  maxPlayers: 200,
  soundEnabled: false,
  theme: "MOVIES" as const,
};
