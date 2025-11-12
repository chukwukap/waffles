import { PrismaClient } from "@prisma/client";
import { getGameQuestions, defaultGameConfig } from "./game-data";

// Resolve root URL (similar to env.ts but works in standalone scripts)
const resolveRootUrl = (): string => {
  const explicitUrl =
    process.env.NEXT_PUBLIC_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? null;

  if (explicitUrl) {
    try {
      new URL(explicitUrl);
      return explicitUrl.replace(/\/$/, "");
    } catch {
      console.warn(
        `Invalid NEXT_PUBLIC_URL provided: ${explicitUrl}. Falling back...`
      );
    }
  }

  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};

const prisma = new PrismaClient();

/**
 * Seed a new game with questions and rounds
 * Usage: pnpm seed:game
 *
 * Creates a new game with:
 * - Start time: 1 minute from now
 * - End time: 1 hour from now
 * - Default game configuration
 * - All rounds and questions from game-data.ts
 */
async function main() {
  // Parse command line arguments for optional customization
  const args = process.argv.slice(2);
  const startMinutes = args[0] ? parseInt(args[0], 10) : 1;
  const durationHours = args[1] ? parseInt(args[1], 10) : 1;

  if (isNaN(startMinutes) || isNaN(durationHours)) {
    console.error("Usage: pnpm seed:game [startMinutes] [durationHours]");
    console.error(
      "Example: pnpm seed:game 5 2  (starts in 5 minutes, lasts 2 hours)"
    );
    process.exit(1);
  }

  const now = Date.now();
  const startTime = new Date(now + startMinutes * 60 * 1000);
  const endTime = new Date(now + durationHours * 60 * 60 * 1000);

  // Get root URL and game questions with full URLs
  const rootUrl = resolveRootUrl();
  const gameQuestions = getGameQuestions(rootUrl);

  console.log(`Creating new game...`);
  console.log(`Root URL: ${rootUrl}`);
  console.log(`Start time: ${startTime.toISOString()}`);
  console.log(`End time: ${endTime.toISOString()}`);

  // Create the game
  const game = await prisma.game.create({
    data: {
      name: "Movie & TV Scene Quiz",
      description: "Guess the movie or TV show a famous scene is from.",
      startTime,
      endTime,
      config: {
        create: defaultGameConfig,
      },
    },
  });

  console.log(`✓ Created game with ID: ${game.id}`);

  // Create rounds and their questions
  for (const round of gameQuestions) {
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

    console.log(
      `✓ Created round ${round.roundNum} with ${round.data.length} questions`
    );
  }

  console.log(`\n✅ Successfully seeded game ${game.id}!`);
  console.log(`   Total rounds: ${gameQuestions.length}`);
  console.log(
    `   Total questions: ${gameQuestions.reduce(
      (sum, r) => sum + r.data.length,
      0
    )}`
  );
}

main()
  .catch((e) => {
    console.error("Error seeding game:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
