/*
  Warnings:

  - You are about to drop the column `questionCount` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `isEliminated` on the `GamePlayer` table. All the data in the column will be lost.
  - You are about to drop the column `invitedById` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - Made the column `coverUrl` on table `Game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `soundUrl` on table `Question` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mediaUrl` on table `Question` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_invitedById_fkey";

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "questionCount",
ALTER COLUMN "entryFee" SET DEFAULT 50,
ALTER COLUMN "entryFee" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "coverUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "GamePlayer" DROP COLUMN "isEliminated";

-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "soundUrl" SET NOT NULL,
ALTER COLUMN "mediaUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "invitedById",
DROP COLUMN "status",
ADD COLUMN     "accessGrantedAt" TIMESTAMP(3),
ADD COLUMN     "accessGrantedBy" INTEGER,
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedBy" INTEGER,
ADD COLUMN     "hasGameAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinedWaitlistAt" TIMESTAMP(3),
ADD COLUMN     "referredById" INTEGER,
ALTER COLUMN "inviteQuota" SET DEFAULT 30;

-- DropEnum
DROP TYPE "UserStatus";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
