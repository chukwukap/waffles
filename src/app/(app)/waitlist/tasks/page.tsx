
import { TasksPageClient } from "./client";
import { WaitlistData } from "../../(game)/api/waitlist/route";
import { env } from "@/lib/env";

async function getWaitlistData(fid: string): Promise<WaitlistData> {
    const response = await fetch(`${env.rootUrl}/api/waitlist?fid=${fid}`, {
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error("Failed to fetch waitlist data");
    }

    return response.json();
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ fid: string }> }) {
    const params = await searchParams;

    // Validate fid parameter
    if (!params.fid) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-white">Missing FID parameter</p>
            </div>
        );
    }

    const waitlistPromise = getWaitlistData(params.fid);
    return (
        <TasksPageClient waitlistPromise={waitlistPromise} />
    );
}
