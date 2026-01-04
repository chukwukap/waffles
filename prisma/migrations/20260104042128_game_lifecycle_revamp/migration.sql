/*
  Warnings:

  - You are about to drop the column `settledAt` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `settlementTxHash` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "settledAt",
DROP COLUMN "settlementTxHash",
ADD COLUMN     "onChainAt" TIMESTAMP(3),
ADD COLUMN     "onChainTxHash" VARCHAR(66),
ADD COLUMN     "rankedAt" TIMESTAMP(3);
