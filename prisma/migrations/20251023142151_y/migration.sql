/*
  Warnings:

  - You are about to drop the column `title` on the `Game` table. All the data in the column will be lost.
  - Added the required column `name` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PrizePoolType" AS ENUM ('FIXED', 'DYNAMIC');

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "ticketPrice" INTEGER NOT NULL DEFAULT 50,
    "roundTimeLimit" INTEGER NOT NULL,
    "questionsPerGame" INTEGER NOT NULL,
    "scoreMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scorePenalty" DOUBLE PRECISION,
    "maxPlayers" INTEGER NOT NULL,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "animationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "prizePoolType" "PrizePoolType" NOT NULL DEFAULT 'FIXED',
    "prizePoolFixedAmount" INTEGER,
    "prizePoolDynamicTickets" INTEGER,
    "timeBonusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "difficultyScaling" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalConfig" (
    "id" SERIAL NOT NULL,
    "ticketPrice" INTEGER NOT NULL DEFAULT 50,
    "roundTimeLimit" INTEGER NOT NULL,
    "questionsPerGame" INTEGER NOT NULL,
    "scoreMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scorePenalty" DOUBLE PRECISION,
    "maxPlayers" INTEGER NOT NULL,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "animationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "prizePoolType" "PrizePoolType" NOT NULL DEFAULT 'FIXED',
    "prizePoolFixedAmount" INTEGER,
    "prizePoolDynamicTickets" INTEGER,
    "timeBonusEnabled" BOOLEAN NOT NULL DEFAULT false,
    "difficultyScaling" DOUBLE PRECISION NOT NULL DEFAULT 1.0,

    CONSTRAINT "GlobalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_gameId_key" ON "GameConfig"("gameId");

-- AddForeignKey
ALTER TABLE "GameConfig" ADD CONSTRAINT "GameConfig_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
