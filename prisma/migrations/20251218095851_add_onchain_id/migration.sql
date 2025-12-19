/*
  Warnings:

  - A unique constraint covering the columns `[onchainId]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "onchainId" VARCHAR(66);

-- CreateIndex
CREATE UNIQUE INDEX "Game_onchainId_key" ON "Game"("onchainId");
