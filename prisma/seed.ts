import { PrismaClient } from "@prisma/client";
import { gameQuestions, defaultGameConfig } from "../scripts/game-data";

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
  // Reuse shared game data
  const questions = gameQuestions;

  // Create the game
  const game = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Movie & TV Scene Quiz",
      description: "Guess the movie or TV show a famous scene is from.",
      startTime: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now
      endTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
      config: {
        create: defaultGameConfig,
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
