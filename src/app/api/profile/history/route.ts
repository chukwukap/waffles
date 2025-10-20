import { NextResponse } from "next/server";

export async function GET() {
  // mock data for history; in a real app, you'd fetch from db or session
  const history = [
    { round: "Round 1", winnings: 50 },
    { round: "Round 2", winnings: 100 },
    { round: "Round 3", winnings: 0 },
    { round: "Round 4", winnings: 200 },
  ];
  return NextResponse.json(history);
}
