"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useQuestActions } from "./_components/useQuestActions";
import { QUESTS, Quest, QuestId, QuestStatus } from "@/lib/quests";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import sdk from "@farcaster/miniapp-sdk";

// WaitlistData type matching v1 API response
export interface WaitlistData {
    fid: number;
    rank: number;
    points: number;
    inviteCode: string | null;
    invitesCount: number;
    status: string;
    completedTasks: string[]; // Maintaining DB field name
}

// Re-export types for backwards compatibility
export type { Quest, QuestId, QuestStatus };
export { QUESTS };

export function QuestsPageClient() {
    const [waitlistData, setWaitlistData] = useState<WaitlistData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch waitlist data on mount using authenticated fetch
    useEffect(() => {
        async function fetchData() {
            try {
                const response = await sdk.quickAuth.fetch("/api/v1/waitlist");
                if (!response.ok) {
                    throw new Error("Failed to fetch waitlist data");
                }
                const data = await response.json();
                setWaitlistData(data);
            } catch (err) {
                console.error("Error fetching waitlist data:", err);
                setError("Failed to load quests");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Initialize quest actions hook
    const { handleGo, handleComplete, getQuestStatus, isPending } = useQuestActions({
        waitlistData: waitlistData ?? {
            fid: 0,
            rank: 0,
            points: 0,
            inviteCode: null,
            invitesCount: 0,
            status: "",
            completedTasks: [],
        },
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <WaffleLoader text="LOADING QUESTS..." />
            </div>
        );
    }

    if (error || !waitlistData) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-red-400">{error || "Failed to load quests"}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col flex-1 overflow-y-auto px-4 py-6 space-y-3">
            {QUESTS.map((quest) => {
                const status = getQuestStatus(quest);
                const isCompleted = status === "completed";
                const isPendingQuest = status === "pending";
                const isInitial = status === "initial";

                return (
                    <div
                        key={quest.id}
                        className={cn(
                            "relative flex items-center justify-center gap-[12px] px-[12px] py-[8px] rounded-[16px]",
                            "bg-[#FFFFFF08] border border-[#FFFFFF14]",
                            "transition-all duration-300",
                            !isCompleted && "hover:border-white/30 hover:bg-[#FFFFFF0C]",
                            !isCompleted ? "h-[109px]" : "h-[86px]",
                            isCompleted && "opacity-50",
                            isPending && "animate-pulse border-[#00CFF2]/50"
                        )}
                    >
                        {/* Icon */}
                        <div className="shrink-0 w-[48px] h-[48px] rounded-full overflow-hidden relative">
                            <Image
                                src={quest.iconPath}
                                alt={quest.title}
                                fill
                                className="object-contain"
                            />
                        </div>

                        {/* Points Badge - only show when not in initial state */}
                        {!isInitial && (
                            <div className={cn(
                                "absolute top-2 right-2 font-body font-normal text-[20px] leading-none",
                                isCompleted ? "text-[#99A0AE]" : "text-[#00CFF2]"
                            )}>
                                +{quest.points}
                            </div>
                        )}

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
                                    {quest.title}
                                </p>
                                <p
                                    className={cn(
                                        "font-display font-medium leading-[130%] tracking-[-0.03em]",
                                        "text-[14px] text-[#99A0AE]"
                                    )}
                                >
                                    {quest.text}
                                </p>
                            </div>

                            {isPendingQuest && (
                                <button
                                    onClick={() => handleComplete(quest.id)}
                                    disabled={isPending}
                                    className={cn(
                                        "w-[96px] h-[29px] rounded-[8px]",
                                        "bg-white text-[#1B8FF5]",
                                        "border-b-[3px] border-r-[3px] border-[#1B8FF5]",
                                        "font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em]",
                                        "flex items-center justify-center text-center pb-1",
                                        "transition-all duration-200",
                                        !isPending && "active:border-b-0 active:border-r-0 active:translate-y-[3px] active:translate-x-[3px]",
                                        !isPending && "hover:brightness-95",
                                        isPending && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    COMPLETE
                                </button>
                            )}
                        </div>
                        {isInitial && (
                            <button
                                onClick={() => handleGo(quest)}
                                disabled={isPending}
                                className={cn(
                                    "w-fit font-body font-normal text-[24px] leading-[100%] tracking-normal text-[#00CFF2]",
                                    !isPending && "hover:opacity-80 transition-all duration-200 text-left",
                                    !isPending && "hover:translate-x-1",
                                    isPending && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                GO
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
