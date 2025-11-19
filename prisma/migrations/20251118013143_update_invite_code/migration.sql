/*
  Warnings:

  - You are about to drop the column `selected` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `timeTaken` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswer` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `roundId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `Ticket` table. All the data in the column will be lost.
  - The `status` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `imageUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `GameConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Round` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoundCompletion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Score` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Waitlist` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,questionId]` on the table `Answer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[inviteCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `latencyMs` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `selectedIndex` to the `Answer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endsAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `theme` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correctIndex` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inviteCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('WAITLIST', 'ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'UNLOCKED', 'CLAIMED');

-- CreateEnum
CREATE TYPE "GameTheme" AS ENUM ('FOOTBALL', 'MOVIES', 'ANIME', 'POLITICS', 'CRYPTO');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REDEEMED');

-- DropForeignKey
ALTER TABLE "public"."GameConfig" DROP CONSTRAINT "GameConfig_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GameParticipant" DROP CONSTRAINT "GameParticipant_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GameParticipant" DROP CONSTRAINT "GameParticipant_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Question" DROP CONSTRAINT "Question_roundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Referral" DROP CONSTRAINT "Referral_inviteeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Referral" DROP CONSTRAINT "Referral_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Round" DROP CONSTRAINT "Round_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoundCompletion" DROP CONSTRAINT "RoundCompletion_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoundCompletion" DROP CONSTRAINT "RoundCompletion_roundId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RoundCompletion" DROP CONSTRAINT "RoundCompletion_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_gameId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Score" DROP CONSTRAINT "Score_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Waitlist" DROP CONSTRAINT "Waitlist_referredBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."Waitlist" DROP CONSTRAINT "Waitlist_userId_fkey";

-- DropIndex
DROP INDEX "public"."Answer_userId_gameId_questionId_key";

-- DropIndex
DROP INDEX "public"."NotificationToken_appFid_idx";

-- DropIndex
DROP INDEX "public"."NotificationToken_userId_idx";

-- DropIndex
DROP INDEX "public"."Question_gameId_idx";

-- DropIndex
DROP INDEX "public"."Question_roundId_idx";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "selected",
DROP COLUMN "timeTaken",
ADD COLUMN     "latencyMs" INTEGER NOT NULL,
ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "selectedIndex" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "message",
ADD COLUMN     "text" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "endTime",
DROP COLUMN "name",
DROP COLUMN "startTime",
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "entryFee" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "maxPlayers" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN     "prizePool" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "questionCount" INTEGER NOT NULL DEFAULT 9,
ADD COLUMN     "roundDurationSec" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "theme" "GameTheme" NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "correctAnswer",
DROP COLUMN "imageUrl",
DROP COLUMN "roundId",
DROP COLUMN "text",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "correctIndex" INTEGER NOT NULL,
ADD COLUMN     "durationSec" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "roundIndex" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Ticket" DROP COLUMN "usedAt",
ADD COLUMN     "redeemedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "TicketStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "imageUrl",
DROP COLUMN "name",
ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "inviteQuota" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "invitedById" INTEGER,
ADD COLUMN     "pfpUrl" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'WAITLIST',
ADD COLUMN     "username" TEXT;

-- DropTable
DROP TABLE "public"."GameConfig";

-- DropTable
DROP TABLE "public"."GameParticipant";

-- DropTable
DROP TABLE "public"."Referral";

-- DropTable
DROP TABLE "public"."Round";

-- DropTable
DROP TABLE "public"."RoundCompletion";

-- DropTable
DROP TABLE "public"."Score";

-- DropTable
DROP TABLE "public"."Waitlist";

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" SERIAL NOT NULL,
    "inviterId" INTEGER NOT NULL,
    "inviteeId" INTEGER NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "amount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMP(3),

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayer" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReward_inviteeId_key" ON "ReferralReward"("inviteeId");

-- CreateIndex
CREATE INDEX "ReferralReward_inviterId_idx" ON "ReferralReward"("inviterId");

-- CreateIndex
CREATE INDEX "GamePlayer_gameId_score_idx" ON "GamePlayer"("gameId", "score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayer_gameId_userId_key" ON "GamePlayer"("gameId", "userId");

-- CreateIndex
CREATE INDEX "Answer_gameId_userId_idx" ON "Answer"("gameId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_userId_questionId_key" ON "Answer"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Chat_gameId_createdAt_idx" ON "Chat"("gameId", "createdAt");

-- CreateIndex
CREATE INDEX "Game_status_startsAt_idx" ON "Game"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Question_gameId_roundIndex_idx" ON "Question"("gameId", "roundIndex");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteCode_key" ON "User"("inviteCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
