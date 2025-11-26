"use client";

import { useMiniKit, useComposeCast } from "@coinbase/onchainkit/minikit";
import { useCallback, useEffect, useState } from "react";
import { env } from "@/lib/env";
import { notify } from "@/components/ui/Toaster";
import { WaitlistData } from "../../(game)/api/waitlist/route";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTaskActions } from "./_components/useTaskActions";


// Task Definitions (define first, then derive types)
export const TASKS = [
    {
        id: "join_discord_general",
        iconPath: "/images/icons/discord.png",
        title: "Join Discord Community",
        text: "Join our Discord server and say hi in #general",
        points: 100,
        actionUrl: "https://discord.gg/waffles",
        type: "link",
    },
    {
        id: "follow_playwaffles_twitter",
        iconPath: "/images/icons/x.png",
        title: "Follow on X",
        text: "Follow @playwaffles on X",
        points: 50,
        actionUrl: "https://x.com/playwaffles",
        type: "link",
    },
    {
        id: "retweet_announcement",
        iconPath: "/images/icons/x.png",
        title: "Retweet Post",
        text: "RT our pinned tweet about Waffles",
        points: 50,
        actionUrl: "https://x.com/wafflesdotfun",
        type: "link",
    },
    {
        id: "follow_waffles_farcaster",
        iconPath: "/images/icons/farcaster.png",
        title: "Follow on Farcaster",
        text: "Follow @waffles on Farcaster",
        points: 50,
        actionUrl: "https://warpcast.com/waffles",
        type: "link",
    },
    {
        id: "share_waitlist_farcaster",
        iconPath: "/images/icons/farcaster.png",
        title: "Share on Farcaster",
        text: "Share Waffles on Farcaster with #Waffles",
        points: 50,
        type: "farcaster_share",
    },
    {
        id: "invite_three_friends",
        iconPath: "/images/icons/invite.png",
        title: "Invite Friends",
        text: "Get 3 friends to join the waitlist",
        points: 200,
        type: "invite",
    },
] as const;

// Types derived from TASKS
export type WaitlistTaskId = typeof TASKS[number]['id'];
export type TaskActionType = typeof TASKS[number]['type'];
export type TaskStatus = "initial" | "pending" | "completed";

export interface WaitlistTask {
    id: WaitlistTaskId;
    iconPath: string;
    title: string;
    text: string;
    points: number;
    actionUrl?: string;
    type: TaskActionType;
}

export function TasksPageClient() {
    const { context, isMiniAppReady, setMiniAppReady } = useMiniKit();
    const fid = context?.user?.fid;

    // We might need rank for sharing, though mostly we need invites count for the tasks
    const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
    const [isLoading, setIsLoading] = useState(true);


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

    // Initialize task actions hook
    const { handleGo, handleComplete, getTaskStatus } = useTaskActions({
        fid,
        completedTasks: waitlistData?.completedTasks ?? [],
        invitesCount: waitlistData?.invites ?? 0,
        onTaskCompleted: fetchWaitlistData,
        waitlistData,
    });

    if (isLoading) {
        return (
            <section className="flex-1 flex items-center justify-center">
                <WaffleLoader text="LOADING TASKS..." />
            </section>
        );
    }
    return (
        <div className="mt-4 px-4">
            <div className="w-full max-w-[361px] mx-auto flex flex-col gap-4 py-4">
                {TASKS.map((task) => {
                    const status = getTaskStatus(task);
                    const isCompleted = status === "completed";
                    const isPending = status === "pending";
                    const isInitial = status === "initial";

                    return (
                        <div
                            key={task.id}
                            className={cn(
                                "relative flex items-center justify-center gap-[12px] px-[12px] py-[8px] rounded-[16px]",
                                "bg-[#FFFFFF08] border border-[#FFFFFF14]",
                                "transition-all duration-300",
                                !isCompleted && "hover:border-white/30 hover:bg-[#FFFFFF0C]",
                                !isCompleted ? "h-[109px]" : "h-[86px]",
                                isCompleted && "opacity-50"
                            )}
                        >
                            {/* Icon */}
                            <div className="shrink-0 w-[48px] h-[48px] rounded-full overflow-hidden relative">
                                <Image
                                    src={task.iconPath}
                                    alt={task.title}
                                    fill
                                    className="object-contain"
                                />
                            </div>

                            {/* Points Badge */}
                            <div className="absolute top-2 right-2 font-body font-normal text-[20px] leading-none text-[#00CFF2]">
                                +{task.points}
                            </div>

                            {/* Text */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex flex-col gap-0.5">
                                    <p
                                        className={cn(
                                            "font-body font-normal text-[20px] leading-[130%] tracking-normal",
                                            isCompleted
                                                ? "text-white line-through decoration-white decoration-2"
                                                : "text-white"
                                        )}
                                    >
                                        {task.title}
                                    </p>
                                    <p
                                        className={cn(
                                            "font-display font-medium leading-[130%] tracking-[-0.03em]",
                                            "text-[14px] text-[#99A0AE]"
                                        )}
                                    >
                                        {task.text}
                                    </p>
                                </div>

                                {isPending && (
                                    <button
                                        onClick={() => handleComplete(task.id)}
                                        className={cn(
                                            "w-[96px] h-[29px] rounded-[8px]",
                                            "bg-white text-[#1B8FF5]",
                                            "border-b-[3px] border-r-[3px] border-[#1B8FF5]",
                                            "font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em]",
                                            "flex items-center justify-center text-center pb-1",
                                            "transition-all duration-200",
                                            "active:border-b-0 active:border-r-0 active:translate-y-[3px] active:translate-x-[3px]",
                                            "hover:brightness-95"
                                        )}
                                    >
                                        COMPLETE
                                    </button>
                                )}
                            </div>
                            {isInitial && (
                                <button
                                    onClick={() => handleGo(task)}
                                    className={cn(
                                        "w-fit font-body font-normal text-[24px] leading-[100%] tracking-normal text-[#00CFF2]",
                                        "hover:opacity-80 transition-all duration-200 text-left",
                                        "hover:translate-x-1"
                                    )}
                                >
                                    GO
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
