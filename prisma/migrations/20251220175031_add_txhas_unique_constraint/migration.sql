/*
  Warnings:

  - A unique constraint covering the columns `[txHash]` on the table `GameEntry` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "maxPlayers" SET DEFAULT 200,
ALTER COLUMN "roundBreakSec" SET DEFAULT 20,
ALTER COLUMN "tierPrices" SET DEFAULT ARRAY[5, 10, 25]::DOUBLE PRECISION[];

-- CreateIndex
CREATE UNIQUE INDEX "GameEntry_txHash_key" ON "GameEntry"("txHash");
