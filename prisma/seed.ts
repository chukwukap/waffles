import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// $> pnpm prisma db seed

/**
 * In Next.js, files in /public are served at the root path.
 * Therefore, "/images/scenes/..." and "/sounds/scenes/scenes/..."
 * are the correct paths for referencing public assets.
 * If using /public/images/scenes/godfather.jpg, reference via "/images/scenes/godfather.jpg"
 * If using /public/sounds/scenes/godfather.mp3, reference via "/sounds/scenes/godfather.mp3"
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
 */

async function main() {
  // Quiz data by round (3 rounds, 3 questions each)
  const questions = [
    // Round 1
    {
      roundNum: 1,
      data: [
        {
          text: "Which classic film is this scene from? (All are Marlon Brando classics)",
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
          text: "Which film is this desert sci-fi scene from?",
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
          text: "Which film features this famous villain?",
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
          text: "Which film about financial excess is this scene from?",
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
          text: "Which movie about a visionary tech founder is this from?",
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
          text: "Which mind-bending sci-fi film is this iconic scene from?",
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
          text: "Which prestige TV show features this scene of a man breaking bad?",
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
          text: "Which epic fantasy show features this battle for the throne?",
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
          text: "Which TV show is a direct inspiration or sibling to Stranger Things?",
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

  // Create the game
  const game = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Movie & TV Scene Quiz",
      description: "Guess the movie or TV show a famous scene is from.",
      startTime: new Date(Date.now() + 3 * 60 * 1000), // 3 minute from now
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      config: {
        create: {
          ticketPrice: 50,
          roundTimeLimit: 15,
          questionsPerGame: 9,
          scoreMultiplier: 1.0,
          scorePenalty: 0,
          maxPlayers: 200,
          soundEnabled: false,
          theme: "MOVIES",
        },
      },
    },
  });

  // Create rounds and their questions
  for (const round of questions) {
    const createdRound = await prisma.round.create({
      data: {
        gameId: game.id,
        roundNum: round.roundNum,
      },
    });
    // Create questions for this round
    await prisma.question.createMany({
      data: round.data.map((q) => ({
        gameId: game.id,
        roundId: createdRound.id,
        text: q.text,
        imageUrl: q.imageUrl,
        soundUrl: q.soundUrl,
        correctAnswer: q.correctAnswer,
        options: q.options,
        createdAt: new Date(),
      })),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
