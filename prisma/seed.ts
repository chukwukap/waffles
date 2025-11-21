import "dotenv/config";
import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

import {
  getGameQuestions,
  defaultGameConfig,
  getCorrectIndex,
} from "../scripts/game-data";

/**
 * In Next.js, files in /public are served at the root path.
 * Therefore, "/images/scenes/..." and "/sounds/scenes/scenes/..."
 * are the correct paths for referencing public assets.
 * If using /public/images/scenes/godfather.jpg, reference via "/images/scenes/godfather.jpg"
 * If using /public/sounds/scenes/godfather.mp3, reference via "/sounds/scenes/godfather.mp3"
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/static-assets
 */

async function main() {
  // Reuse shared game data with full URLs
  const rounds = getGameQuestions();

  // Create the game
  const game = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Movie & TV Scene Quiz",
      description: "Guess the movie or TV show a famous scene is from.",
      theme: defaultGameConfig.theme,
      status: "SCHEDULED",
      startsAt: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now
      endsAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      entryFee: defaultGameConfig.entryFee,
      prizePool: defaultGameConfig.prizePool,
      roundDurationSec: defaultGameConfig.roundDurationSec,
      questionCount: defaultGameConfig.questionCount,
      maxPlayers: defaultGameConfig.maxPlayers,
    },
  });

  // Create questions for each round
  for (const round of rounds) {
    // Create questions for this round
    await prisma.question.createMany({
      data: round.questions.map((q) => ({
        gameId: game.id,
        roundIndex: round.roundIndex,
        content: q.content,
        mediaUrl: q.mediaUrl,
        options: q.options,
        correctIndex: getCorrectIndex(q.correctAnswer, q.options),
        durationSec: defaultGameConfig.roundDurationSec,
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
