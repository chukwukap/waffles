import { NextResponse } from "next/server";
import { allTimeData, currentData } from "@/lib/apiMocks"; // Assume mockData.ts exists

export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  const type = params.type;

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (type === "current") {
    return NextResponse.json(currentData);
  } else if (type === "alltime") {
    return NextResponse.json(allTimeData);
  } else {
    return NextResponse.json(
      { error: "Invalid leaderboard type" },
      { status: 400 }
    );
  }
}
