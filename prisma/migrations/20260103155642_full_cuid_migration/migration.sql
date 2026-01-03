/*
  Warnings:

  - The primary key for the `AuditLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Chat` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `CompletedQuest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `GameEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `InviteCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `NotificationToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Quest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Question` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ReferralReward` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_userId_fkey";

-- DropForeignKey
ALTER TABLE "CompletedQuest" DROP CONSTRAINT "CompletedQuest_questId_fkey";

-- DropForeignKey
ALTER TABLE "CompletedQuest" DROP CONSTRAINT "CompletedQuest_userId_fkey";

-- DropForeignKey
ALTER TABLE "GameEntry" DROP CONSTRAINT "GameEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "InviteCode" DROP CONSTRAINT "InviteCode_usedById_fkey";

-- DropForeignKey
ALTER TABLE "NotificationToken" DROP CONSTRAINT "NotificationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "ReferralReward" DROP CONSTRAINT "ReferralReward_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_referredById_fkey";

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "adminId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AuditLog_id_seq";

-- AlterTable
ALTER TABLE "Chat" DROP CONSTRAINT "Chat_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Chat_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Chat_id_seq";

-- AlterTable
ALTER TABLE "CompletedQuest" DROP CONSTRAINT "CompletedQuest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "questId" SET DATA TYPE TEXT,
ALTER COLUMN "approvedBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "CompletedQuest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "CompletedQuest_id_seq";

-- AlterTable
ALTER TABLE "GameEntry" DROP CONSTRAINT "GameEntry_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "GameEntry_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "GameEntry_id_seq";

-- AlterTable
ALTER TABLE "InviteCode" DROP CONSTRAINT "InviteCode_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "usedById" SET DATA TYPE TEXT,
ADD CONSTRAINT "InviteCode_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "InviteCode_id_seq";

-- AlterTable
ALTER TABLE "NotificationToken" DROP CONSTRAINT "NotificationToken_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ADD CONSTRAINT "NotificationToken_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "NotificationToken_id_seq";

-- AlterTable
ALTER TABLE "Quest" DROP CONSTRAINT "Quest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Quest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Quest_id_seq";

-- AlterTable
ALTER TABLE "Question" DROP CONSTRAINT "Question_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Question_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Question_id_seq";

-- AlterTable
ALTER TABLE "ReferralReward" DROP CONSTRAINT "ReferralReward_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "inviterId" SET DATA TYPE TEXT,
ALTER COLUMN "inviteeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ReferralReward_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "accessGrantedBy" SET DATA TYPE TEXT,
ALTER COLUMN "bannedBy" SET DATA TYPE TEXT,
ALTER COLUMN "referredById" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedQuest" ADD CONSTRAINT "CompletedQuest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompletedQuest" ADD CONSTRAINT "CompletedQuest_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameEntry" ADD CONSTRAINT "GameEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteCode" ADD CONSTRAINT "InviteCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
