import { LeaderboardClient } from "./client";
import { LeaderboardData } from "@/app/api/leaderboard/route";
import { env } from "@/lib/env";

async function getLeaderboardData(fid: string): Promise<LeaderboardData> {
    const response = await fetch(`${env.rootUrl}/api/waitlist/leaderboard?fid=${fid}&limit=50`, {
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error("Failed to fetch leaderboard data");
    }

    return response.json();
}

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ fid: string }> }) {
    const params = await searchParams;

    // Validate fid parameter
    if (!params.fid) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-white">Missing FID parameter</p>
            </div>
        );
    }

    const leaderboardPromise = getLeaderboardData(params.fid);
    return (
        <LeaderboardClient leaderboardPromise={leaderboardPromise} />
    );
}
