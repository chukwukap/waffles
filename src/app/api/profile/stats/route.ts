import { NextResponse } from "next/server";

export async function GET() {
  // mock stats data
  const stats = {
    totalGames: 42,
    wins: 18,
    winRate: 42.9,
    totalWon: 5400,
    highestScore: 98,
    avgScore: 76,
    currentStreak: 3,
    bestRank: 1,
  };
  return NextResponse.json(stats);
}
