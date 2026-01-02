-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "merkleRoot" VARCHAR(66),
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "settlementTxHash" VARCHAR(66);

-- AlterTable
ALTER TABLE "GameEntry" ADD COLUMN     "merkleAmount" VARCHAR(78),
ADD COLUMN     "merkleProof" JSONB;
