// /prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// $> pnpm prisma db seed

async function main() {
  // 1. USERS
  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      name: "Test User",
      email: "test@example.com",
      farcasterId: "123",
      imageUrl: "https://picsum.photos/100?test",
      wallet: "0xTest0000000000000000000000000000000001234567",
    },
  });

  // 3. GAMES
  const game1 = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Test Game",
      description: "A fun test game",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      questions: {
        create: [
          {
            text: "Which movie is this scene from?",
            options: ["The Matrix", "Inception", "Pulp Fiction", "Fight Club"],
            correctAnswer: "The Matrix",
            imageUrl: "https://picsum.photos/200/300?matrix-pose",
            createdAt: new Date(),
          },
          {
            text: "Name this crypto event.",
            options: [
              "Mt. Gox Collapse",
              "Coinbase IPO",
              "Ethereum Merge",
              "Dogecoin Surge",
            ],
            correctAnswer: "Coinbase IPO",
            imageUrl: "https://picsum.photos/200/300?coinbase-ipo",
            createdAt: new Date(),
          },
          {
            text: "Which film is this dream scene?",
            options: ["Inception", "Blade Runner", "Tenet", "The Prestige"],
            correctAnswer: "Inception",
            imageUrl: "https://picsum.photos/200/300?inception-dream",
            createdAt: new Date(),
          },
          {
            text: "Which event is this NFT launch?",
            options: [
              "CryptoPunks",
              "Bored Ape Yacht Club",
              "Doodles",
              "Cool Cats",
            ],
            correctAnswer: "Bored Ape Yacht Club",
            imageUrl: "https://picsum.photos/200/300?bayc",
            createdAt: new Date(),
          },
          {
            text: "Which movie is this force scene?",
            options: [
              "Star Wars",
              "Star Trek",
              "The Lord of the Rings",
              "Avatar",
            ],
            correctAnswer: "Star Wars",
            imageUrl: "https://picsum.photos/200/300?star-wars-force",
            createdAt: new Date(),
          },
          {
            text: "Which event is this crypto crash?",
            options: [
              "Mt. Gox Collapse",
              "Terra Luna Crash",
              "Silk Road Bust",
              "Bitfinex Hack",
            ],
            correctAnswer: "Mt. Gox Collapse",
            imageUrl: "https://picsum.photos/200/300?mtgox-collapse",
            createdAt: new Date(),
          },
        ],
      },
      config: {
        create: {
          ticketPrice: 50,
          roundTimeLimit: 15,
          questionsPerGame: 6,
          scoreMultiplier: 1.0,
          scorePenalty: 0,
          maxPlayers: 200,
          soundEnabled: true,
        },
      },
    },
  });

  console.log(`Seeded users: ${testUser.name}\nSeeded games: ${game1.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
