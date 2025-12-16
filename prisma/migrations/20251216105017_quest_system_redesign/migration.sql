/*
  Warnings:

  - You are about to drop the column `completedTasks` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('LINK', 'FARCASTER_FOLLOW', 'FARCASTER_CAST', 'FARCASTER_RECAST', 'REFERRAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "QuestCategory" AS ENUM ('SOCIAL', 'ONBOARDING', 'REFERRAL', 'ENGAGEMENT', 'SPECIAL');

-- CreateEnum
CREATE TYPE "RepeatFrequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'UNLIMITED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "completedTasks";

-- CreateTable
CREATE TABLE "Quest" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "category" "QuestCategory" NOT NULL DEFAULT 'SOCIAL',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "type" "QuestType" NOT NULL,
    "actionUrl" TEXT,
    "castHash" TEXT,
    "targetFid" INTEGER,
    "requiredCount" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "repeatFrequency" "RepeatFrequency" NOT NULL DEFAULT 'ONCE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompletedQuest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "CompletedQuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quest_slug_key" ON "Quest"("slug");

-- CreateIndex
CREATE INDEX "CompletedQuest_userId_idx" ON "CompletedQuest"("userId");

-- CreateIndex
CREATE INDEX "CompletedQuest_questId_idx" ON "CompletedQuest"("questId");

-- CreateIndex
CREATE INDEX "CompletedQuest_userId_questId_idx" ON "CompletedQuest"("userId", "questId");

-- AddForeignKey
ALTER TABLE "CompletedQuest" ADD CONSTRAINT "CompletedQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedQuest" ADD CONSTRAINT "CompletedQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
