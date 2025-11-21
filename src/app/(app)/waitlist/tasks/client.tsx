"use client";

import { useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit";
import { useCallback, useEffect, useState } from "react";
import { WaitlistTasks } from "./_components/WaitlistTasks";
import { env } from "@/lib/env";
import { notify } from "@/components/ui/Toaster";
import { WaitlistData } from "../../(game)/api/waitlist/route";

export function TasksPageClient() {
    const { context, isMiniAppReady, setMiniAppReady } = useMiniKit();
    const fid = context?.user?.fid;

    // We might need rank for sharing, though mostly we need invites count for the tasks
    const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isMiniAppReady) {
            setMiniAppReady();
        }
    }, [isMiniAppReady, setMiniAppReady]);

    const fetchWaitlistData = useCallback(async () => {
        if (!fid) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`/api/waitlist?fid=${fid}`);

            if (!response.ok) {
                throw new Error("Failed to fetch waitlist data");
            }

            const data: WaitlistData = await response.json();
            setWaitlistData(data);
        } catch (err) {
            console.error("Error fetching waitlist data:", err);
        } finally {
            setIsLoading(false);
        }
    }, [fid]);

    useEffect(() => {
        fetchWaitlistData();
    }, [fetchWaitlistData]);

    const { composeCastAsync } = useComposeCast();
    const share = useCallback(async () => {
        const rank = waitlistData?.rank ?? null;
        const message = `I'm on the Waffles waitlist! Join me!`;
        try {
            const result = await composeCastAsync({
                text: message,
                embeds: [
                    `${env.rootUrl}/waitlist?ref=${fid}&rank=${rank}`,
                ],
            });
            if (result?.cast) notify.success("Shared successfully!");
            else notify.info("Share cancelled.");
        } catch {
            notify.error("Failed to share waitlist.");
        }
    }, [composeCastAsync, fid, waitlistData?.rank]);


    if (isLoading) {
        return (
            <section className="flex-1 flex items-center justify-center">
                <h1 className={"font-body font-normal not-italic text-[44px] leading-[92%] tracking-[-0.03em] text-center text-white"}>LOADING...</h1>
            </section>
        );
    }
    return (
        <div className="mt-4 px-4">
            <WaitlistTasks
                invitesCount={waitlistData?.invites ?? 0}
                onInviteClick={share}
                completedTasks={waitlistData?.completedTasks ?? []}
                fid={fid}
            />
        </div>
    );
}
