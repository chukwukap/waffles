/*
  Warnings:

  - You are about to drop the column `ticketPrice` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "ticketPrice",
ADD COLUMN     "tierPrices" DOUBLE PRECISION[] DEFAULT ARRAY[20, 50, 100]::DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "GameEntry" ADD COLUMN     "leftAt" TIMESTAMP(3),
ADD COLUMN     "paidAmount" DOUBLE PRECISION;
