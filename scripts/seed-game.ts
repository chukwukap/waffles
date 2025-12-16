import {
  getGameQuestions,
  defaultGameConfig,
  getCorrectIndex,
} from "./game-data";
import { PrismaClient } from "../prisma/generated/client";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Seed a new game with questions
 * Usage: pnpm seed:game [startMinutes] [durationHours]
 *
 * Creates a new game with:
 * - Start time: 1 minute from now (or custom)
 * - End time: 1 hour from now (or custom)
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
  const startsAt = new Date(now + startMinutes * 60 * 1000);
  const endsAt = new Date(now + durationHours * 60 * 60 * 1000);

  // Get game questions
  const rounds = getGameQuestions();

  console.log(`Creating new game...`);
  console.log(`Start time: ${startsAt.toISOString()}`);
  console.log(`End time: ${endsAt.toISOString()}`);

  // Create the game
  const game = await prisma.game.create({
    data: {
      title: "Movie & TV Scene Quiz",
      description: "Guess the movie or TV show a famous scene is from.",
      theme: defaultGameConfig.theme,
      status: "SCHEDULED",
      coverUrl: "/images/covers/movie-quiz.jpg",
      startsAt,
      endsAt,
      entryFee: defaultGameConfig.entryFee,
      prizePool: defaultGameConfig.prizePool,
      roundBreakSec: defaultGameConfig.roundDurationSec,
      maxPlayers: defaultGameConfig.maxPlayers,
    },
  });

  console.log(`✓ Created game with ID: ${game.id}`);

  // Create questions for each round
  for (const round of rounds) {
    // Create questions for this round
    await prisma.question.createMany({
      data: round.questions.map((q) => ({
        gameId: game.id,
        roundIndex: round.roundIndex,
        content: q.content,
        soundUrl: q.soundUrl || "",
        mediaUrl: q.mediaUrl,
        options: q.options,
        correctIndex: getCorrectIndex(q.correctAnswer, q.options),
        durationSec: defaultGameConfig.roundDurationSec,
      })),
    });

    console.log(
      `✓ Created round ${round.roundIndex} with ${round.questions.length} questions`
    );
  }

  const totalQuestions = rounds.reduce((sum, r) => sum + r.questions.length, 0);

  console.log(`\n✅ Successfully seeded game ${game.id}!`);
  console.log(`   Total rounds: ${rounds.length}`);
  console.log(`   Total questions: ${totalQuestions}`);
}

main()
  .catch((e) => {
    console.error("Error seeding game:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
