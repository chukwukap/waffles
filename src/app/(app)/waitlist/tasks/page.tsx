import { TasksPageClient, WaitlistData } from "./client";
import { env } from "@/lib/env";

async function getWaitlistData(fid: string): Promise<WaitlistData> {
    // Note: Server component can't use sdk.quickAuth.fetch
    // This page should redirect or the client should handle auth
    const response = await fetch(`${env.rootUrl}/api/v1/waitlist`, {
        cache: 'no-store',
        // Pass auth header if available via cookies/session
    });

    if (!response.ok) {
        throw new Error("Failed to fetch waitlist data");
    }

    return response.json();
}

export default async function TasksPage() {
    // Server component doesn't have access to auth token
    // Let client handle the authenticated fetch
    const waitlistPromise = getWaitlistData("");
    return (
        <TasksPageClient waitlistPromise={waitlistPromise} />
    );
}
