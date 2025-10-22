// /prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Seed Game 1 with two questions
  const game1 = await prisma.game.upsert({
    where: { title: "Trivia Time" },
    update: {},
    create: {
      title: "Trivia Time",
      description: "A fun trivia game",
      questions: {
        create: [
          {
            text: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: "4",
          },
          {
            text: "What is the capital of France?",
            options: ["Berlin", "London", "Paris", "Rome"],
            correctAnswer: "Paris",
          },
        ],
      },
    },
  });

  // Seed Game 2 with two questions
  const game2 = await prisma.game.upsert({
    where: { title: "Math Marathon" },
    update: {},
    create: {
      title: "Math Marathon",
      description: "Test your math skills",
      questions: {
        create: [
          {
            text: "What is 10 * 10?",
            options: ["100", "90", "110", "10"],
            correctAnswer: "100",
          },
          {
            text: "What is the square root of 16?",
            options: ["2", "3", "4", "5"],
            correctAnswer: "4",
          },
        ],
      },
    },
  });

  console.log(`Seeded games: ${game1.title}, ${game2.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
