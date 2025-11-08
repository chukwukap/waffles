/*
  Warnings:

  - A unique constraint covering the columns `[userId,appFid]` on the table `NotificationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `appFid` to the `NotificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."NotificationToken_token_key";

-- DropIndex
DROP INDEX "public"."NotificationToken_userId_key";

-- AlterTable
ALTER TABLE "NotificationToken" ADD COLUMN     "appFid" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "NotificationToken_appFid_idx" ON "NotificationToken"("appFid");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationToken_userId_appFid_key" ON "NotificationToken"("userId", "appFid");
