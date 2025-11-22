-- CreateIndex
CREATE INDEX "user_correct_idx" ON "Answer"("userId", "isCorrect");

-- RenameIndex
ALTER INDEX "Answer_gameId_userId_idx" RENAME TO "game_user_idx";
