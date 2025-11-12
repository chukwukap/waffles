-- CreateTable
CREATE TABLE "RoundCompletion" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "roundId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoundCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoundCompletion_userId_idx" ON "RoundCompletion"("userId");

-- CreateIndex
CREATE INDEX "RoundCompletion_gameId_idx" ON "RoundCompletion"("gameId");

-- CreateIndex
CREATE INDEX "RoundCompletion_roundId_idx" ON "RoundCompletion"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RoundCompletion_userId_gameId_roundId_key" ON "RoundCompletion"("userId", "gameId", "roundId");

-- AddForeignKey
ALTER TABLE "RoundCompletion" ADD CONSTRAINT "RoundCompletion_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundCompletion" ADD CONSTRAINT "RoundCompletion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoundCompletion" ADD CONSTRAINT "RoundCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
