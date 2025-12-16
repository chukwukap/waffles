/*
  Warnings:

  - You are about to alter the column `action` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `entityType` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `ip` on the `AuditLog` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(45)`.
  - You are about to alter the column `text` on the `Chat` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `pointsAwarded` on the `CompletedQuest` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `entryFee` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Game` table. All the data in the column will be lost.
  - You are about to alter the column `description` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to alter the column `maxPlayers` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `title` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `coverUrl` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `roundBreakSec` on the `Game` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `token` on the `NotificationToken` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `url` on the `NotificationToken` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `slug` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `title` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `description` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `iconUrl` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `sortOrder` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `points` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `actionUrl` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `castHash` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(66)`.
  - You are about to alter the column `requiredCount` on the `Quest` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `order` on the `Question` table. All the data in the column will be lost.
  - You are about to alter the column `soundUrl` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `content` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(1000)`.
  - You are about to alter the column `correctIndex` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `durationSec` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `mediaUrl` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `roundIndex` on the `Question` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `amount` on the `ReferralReward` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `wallet` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(42)`.
  - You are about to alter the column `inviteCode` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(25)`.
  - You are about to alter the column `inviteQuota` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `pfpUrl` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to alter the column `username` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GamePlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,questId]` on the table `CompletedQuest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "GameTheme" ADD VALUE 'GENERAL';

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_userId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_gameId_fkey";

-- DropForeignKey
ALTER TABLE "GamePlayer" DROP CONSTRAINT "GamePlayer_userId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_gameId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_userId_fkey";

-- DropIndex
DROP INDEX "CompletedQuest_userId_questId_idx";

-- DropIndex
DROP INDEX "Game_status_startsAt_idx";

-- DropIndex
DROP INDEX "Question_gameId_roundIndex_idx";

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "action" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "entityType" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "ip" SET DATA TYPE VARCHAR(45);

-- AlterTable
ALTER TABLE "Chat" ALTER COLUMN "text" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "CompletedQuest" ALTER COLUMN "pointsAwarded" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "entryFee",
DROP COLUMN "status",
ADD COLUMN     "playerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ticketPrice" DOUBLE PRECISION NOT NULL DEFAULT 5,
ALTER COLUMN "description" SET DATA TYPE VARCHAR(1000),
ALTER COLUMN "maxPlayers" SET DEFAULT 100,
ALTER COLUMN "maxPlayers" SET DATA TYPE SMALLINT,
ALTER COLUMN "prizePool" SET DEFAULT 0,
ALTER COLUMN "prizePool" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "coverUrl" DROP NOT NULL,
ALTER COLUMN "coverUrl" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "roundBreakSec" SET DEFAULT 15,
ALTER COLUMN "roundBreakSec" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "NotificationToken" ALTER COLUMN "token" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "url" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "Quest" ALTER COLUMN "slug" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "iconUrl" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "sortOrder" SET DATA TYPE SMALLINT,
ALTER COLUMN "points" SET DATA TYPE SMALLINT,
ALTER COLUMN "actionUrl" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "castHash" SET DATA TYPE VARCHAR(66),
ALTER COLUMN "requiredCount" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "order",
ADD COLUMN     "orderInRound" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "points" SMALLINT NOT NULL DEFAULT 100,
ALTER COLUMN "soundUrl" DROP NOT NULL,
ALTER COLUMN "soundUrl" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "content" SET DATA TYPE VARCHAR(1000),
ALTER COLUMN "correctIndex" SET DATA TYPE SMALLINT,
ALTER COLUMN "durationSec" SET DATA TYPE SMALLINT,
ALTER COLUMN "mediaUrl" DROP NOT NULL,
ALTER COLUMN "mediaUrl" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "roundIndex" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "ReferralReward" ALTER COLUMN "amount" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "waitlistRank" INTEGER,
ALTER COLUMN "wallet" SET DATA TYPE VARCHAR(42),
ALTER COLUMN "inviteCode" SET DATA TYPE VARCHAR(25),
ALTER COLUMN "inviteQuota" SET DATA TYPE SMALLINT,
ALTER COLUMN "pfpUrl" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "username" SET DATA TYPE VARCHAR(100);

-- DropTable
DROP TABLE "Answer";

-- DropTable
DROP TABLE "GamePlayer";

-- DropTable
DROP TABLE "Ticket";

-- DropEnum
DROP TYPE "GameStatus";

-- DropEnum
DROP TYPE "TicketStatus";

-- CreateTable
CREATE TABLE "GameEntry" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "txHash" VARCHAR(66),
    "paidAt" TIMESTAMP(3),
    "score" INTEGER NOT NULL DEFAULT 0,
    "answered" SMALLINT NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "rank" SMALLINT,
    "prize" DOUBLE PRECISION,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameEntry_gameId_score_idx" ON "GameEntry"("gameId", "score" DESC);

-- CreateIndex
CREATE INDEX "GameEntry_userId_createdAt_idx" ON "GameEntry"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GameEntry_gameId_userId_key" ON "GameEntry"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedQuest_userId_questId_key" ON "CompletedQuest"("userId", "questId");

-- CreateIndex
CREATE INDEX "Game_startsAt_idx" ON "Game"("startsAt");

-- CreateIndex
CREATE INDEX "Game_endsAt_idx" ON "Game"("endsAt");

-- CreateIndex
CREATE INDEX "Question_gameId_roundIndex_orderInRound_idx" ON "Question"("gameId", "roundIndex", "orderInRound");

-- CreateIndex
CREATE INDEX "User_waitlistPoints_idx" ON "User"("waitlistPoints" DESC);

-- AddForeignKey
ALTER TABLE "GameEntry" ADD CONSTRAINT "GameEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEntry" ADD CONSTRAINT "GameEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
