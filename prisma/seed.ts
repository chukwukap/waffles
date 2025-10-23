// /prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Seed Game 1 with two questions
  const game1 = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Trivia Time",
      description: "A fun trivia game",
      questions: {
        create: [
          {
            text: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: "4",
            imageUrl: "https://picsum.photos/200/300",
            createdAt: new Date(),
          },
          {
            text: "What is the capital of France?",
            options: ["Berlin", "London", "Paris", "Rome"],
            correctAnswer: "Paris",
            imageUrl: "https://picsum.photos/200/300",
            createdAt: new Date(),
          },
        ],
      },
    },
  });

  // Seed Game 2 with two questions
  const game2 = await prisma.game.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "Math Marathon",
      description: "Test your math skills",
      questions: {
        create: [
          {
            text: "What is 10 * 10?",
            options: ["100", "90", "110", "10"],
            correctAnswer: "100",
            imageUrl: "https://picsum.photos/200/300",
            createdAt: new Date(),
          },
          {
            text: "What is the square root of 16?",
            options: ["2", "3", "4", "5"],
            correctAnswer: "4",
            imageUrl: "https://picsum.photos/200/300",
            createdAt: new Date(),
          },
        ],
      },
    },
  });

  console.log(`Seeded games: ${game1.name}, ${game2.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
