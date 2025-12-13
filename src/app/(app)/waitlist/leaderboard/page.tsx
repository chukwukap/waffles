import { LeaderboardClient, LeaderboardData } from "./client";
import { env } from "@/lib/env";

async function getLeaderboardData(limit: number = 100): Promise<LeaderboardData> {
    const response = await fetch(`${env.rootUrl}/api/v1/waitlist/leaderboard?limit=${limit}`, {
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
    }

    return response.json();
}

export default async function LeaderboardPage() {
    const leaderboardPromise = getLeaderboardData();
    return (
        <LeaderboardClient leaderboardPromise={leaderboardPromise} />
    );
}
