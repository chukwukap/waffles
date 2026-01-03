/*
  Warnings:

  - A unique constraint covering the columns `[gameNumber]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "gameNumber" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Game_gameNumber_key" ON "Game"("gameNumber");
