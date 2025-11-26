import { LeaderboardClient, LeaderboardHeader } from "./client";

export default function LeaderboardPage() {
    return (
        <section className="flex-1 overflow-y-auto pb-8 min-h-screen bg-linear-to-b from-[#191919] to-[#0A0A0A]">
            <div className="sticky top-0 z-50 w-full backdrop-blur-md mb-2">
                <LeaderboardHeader />
            </div>
            <LeaderboardClient />
        </section>
    );
}
