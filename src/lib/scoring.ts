export function calculateScore(timeTaken: number, maxTime: number): number {
  const speedRatio = (maxTime - timeTaken) / maxTime;
  const basePoints = 300 + speedRatio * 2700; // between 300–3000
  return Math.round(basePoints);
}

export function isMatch(choiceId: number, targetId: number): boolean {
  // In real version: compare identifiers for correct pair
  return choiceId === targetId;
}
