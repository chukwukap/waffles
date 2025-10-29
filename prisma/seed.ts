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
  // 1. USERS
  const testUser = await prisma.user.upsert({
    where: { fid: 123 },
    update: {},
    create: {
      name: "Test User",
      fid: 123,
      imageUrl: "https://picsum.photos/100?test",
      wallet: "0xTest0000000000000000000000000000000001234567",
    },
  });

  // 2. GAMES & QUESTIONS
  const game1 = await prisma.game.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Movie & TV Scene Quiz",
      description: "Guess the movie or TV show a famous scene is from.",
      startTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
      endTime: new Date(Date.now() + 65 * 60 * 1000), // 1 hour after start
      questions: {
        create: [
          {
            // GODFATHER
            text: "Which Marlon Brando movie is this iconic mafia scene from?",
            options: [
              "On the Waterfront (1954)",
              "A Streetcar Named Desire (1951)",
              "Apocalypse Now (1979)",
              "The Freshman (1990)",
              "The Godfather (1972)",
            ],
            correctAnswer: "The Godfather (1972)",
            imageUrl: "/images/scenes/godfather.jpg",
            soundUrl: "/sounds/scenes/godfather.mp3",
            createdAt: new Date(),
          },
          {
            // DUNE
            text: "This desert planet scene is from which epic sci-fi movie?",
            options: [
              "Blade Runner 2049 (2017)",
              "Interstellar (2014)",
              "Mad Max: Fury Road (2015)",
              "Lawrence of Arabia (1962)",
              "Dune (2021/2024)",
            ],
            correctAnswer: "Dune (2021/2024)",
            imageUrl: "/images/scenes/dune.jpg",
            soundUrl: "/sounds/scenes/dune.mp3",
            createdAt: new Date(),
          },
          {
            // THE DARK KNIGHT
            text: "Which film features this nihilistic villain and chaotic city scene?",
            options: [
              "American Psycho (2000)",
              "Joker (2019)",
              "The Departed (2006)",
              "No Country for Old Men (2007)",
              "The Dark Knight (2008)",
            ],
            correctAnswer: "The Dark Knight (2008)",
            imageUrl: "/images/scenes/dark-knight.jpg",
            soundUrl: "/sounds/scenes/dark-knight.mp3",
            createdAt: new Date(),
          },
          {
            // WOLF OF WALL STREET
            text: "In which film is this wild sales floor and stock-broker excess scene found?",
            options: [
              "Glengarry Glen Ross (1992)",
              "Boiler Room (2000)",
              "The Big Short (2015)",
              "American Psycho (2000)",
              "The Wolf of Wall Street (2013)",
            ],
            correctAnswer: "The Wolf of Wall Street (2013)",
            imageUrl: "/images/scenes/wolf-of-wall-street.jpg",
            soundUrl: "/sounds/scenes/wolf-of-wall-street.mp3",
            createdAt: new Date(),
          },
          {
            // SOCIAL NETWORK
            text: "Which film about ruthless ambition in tech does this Harvard dorm scene appear in?",
            options: [
              "Steve Jobs (2015)",
              "The Girl with the Dragon Tattoo (2011)",
              "The Founder (2016)",
              "Moneyball (2011)",
              "The Social Network (2010)",
            ],
            correctAnswer: "The Social Network (2010)",
            imageUrl: "/images/scenes/social-network.jpg",
            soundUrl: "/sounds/scenes/social-network.mp3",
            createdAt: new Date(),
          },
          {
            // THE MATRIX
            text: "This reality-bending moment is from which mind-bending science fiction film?",
            options: [
              "Dark City (1998)",
              "Inception (2010)",
              "Equilibrium (2002)",
              "A Scanner Darkly (2006)",
              "The Matrix (1999)",
            ],
            correctAnswer: "The Matrix (1999)",
            imageUrl: "/images/scenes/matrix.jpg",
            soundUrl: "/sounds/scenes/matrix.mp3",
            createdAt: new Date(),
          },
          {
            // BREAKING BAD
            text: "Which show features this chemistry teacher-turned-drug lord in a desert setting?",
            options: [
              "Better Call Saul (2015-2022)",
              "The Shield (2002-2008)",
              "Ozark (2017-2022)",
              "The Sopranos (1999-2007)",
              "Breaking Bad (2008-2013)",
            ],
            correctAnswer: "Breaking Bad (2008-2013)",
            imageUrl: "/images/scenes/breaking-bad.jpg",
            soundUrl: "/sounds/scenes/breaking-bad.mp3",
            createdAt: new Date(),
          },
          {
            // GAME OF THRONES
            text: "This throne room scene with warring houses is from which fantasy TV series?",
            options: [
              "House of the Dragon (2022-Present)",
              "The Lord of the Rings: The Rings of Power (2022-Present)",
              "Succession (2018-2023)",
              "Vikings (2013-2020)",
              "Game of Thrones (2011-2019)",
            ],
            correctAnswer: "Game of Thrones (2011-2019)",
            imageUrl: "/images/scenes/got.jpg",
            soundUrl: "/sounds/scenes/got.mp3",
            createdAt: new Date(),
          },
        ],
      },
      config: {
        create: {
          ticketPrice: 50,
          roundTimeLimit: 15,
          questionsPerGame: 8,
          scoreMultiplier: 1.0,
          scorePenalty: 0,
          maxPlayers: 200,
          soundEnabled: false,
          theme: "MOVIES",
        },
      },
    },
  });

  // Create a referral code for the test user (as inviter)
  const referral = await prisma.referral.create({
    data: {
      code: "123456",
      inviterId: testUser.id,
      // No invitee yet, so inviteeId is null
    },
  });

  console.log(
    `Seeded referral code: ${referral.code} for user: ${testUser.name}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
