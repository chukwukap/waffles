/*
  Warnings:

  - You are about to drop the column `roundDurationSec` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "roundDurationSec",
ADD COLUMN     "roundBreakSec" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN "entryFee" SET DEFAULT 20;
