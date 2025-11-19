"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    DiscordIcon,
    XIcon,
    FarcasterIcon,
    GroupIcon,
} from "@/components/icons";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { notify } from "@/components/ui/Toaster";

// Define the Task type
type TaskId =
    | "discord_join"
    | "twitter_follow"
    | "twitter_rt"
    | "farcaster_follow"
    | "farcaster_share"
    | "invite_friends";

interface Task {
    id: TaskId;
    icon: React.ReactNode;
    text: string;
    actionUrl?: string;
    actionLabel?: string; // Defaults to "GO"
    type: "link" | "invite";
}

interface WaitlistTasksProps {
    invitesCount: number;
    onInviteClick: () => void;
}

// Hardcoded task definitions based on your screenshots
const TASKS: Task[] = [
    {
        id: "discord_join",
        icon: <DiscordIcon className="w-12 h-12" />,
        text: "Join our Discord server and say hi in #general",
        actionUrl: "https://discord.gg/waffles", // Replace with actual
        type: "link",
    },
    {
        id: "twitter_follow",
        icon: <XIcon className="w-12 h-12" />,
        text: "Follow @Wafflesdotfun on Twitter",
        actionUrl: "https://twitter.com/Wafflesdotfun",
        type: "link",
    },
    {
        id: "twitter_rt",
        icon: <XIcon className="w-12 h-12" />,
        text: "RT our pinned tweet about Waffles",
        actionUrl: "https://twitter.com/Wafflesdotfun", // Replace with specific tweet
        type: "link",
    },
    {
        id: "farcaster_follow",
        icon: <FarcasterIcon className="w-12 h-12" />,
        text: "Follow @waffles on Farcaster",
        actionUrl: "https://warpcast.com/waffles",
        type: "link",
    },
    {
        id: "farcaster_share",
        icon: <FarcasterIcon className="w-12 h-12" />,
        text: "Share Waffles on Farcaster with #Waffles",
        actionUrl: "https://warpcast.com/~/compose?text=I%27m%20joining%20Waffles!&embeds[]=https://playwaffles.fun",
        type: "link",
    },
    {
        id: "invite_friends",
        icon: <GroupIcon className="w-12 h-12" />,
        text: "Get 3 friends to join the waitlist",
        type: "invite",
    },
];

export function WaitlistTasks({
    invitesCount,
    onInviteClick,
}: WaitlistTasksProps) {
    // Track which tasks have been "started" (clicked GO)
    // We use a simple array of TaskIds in local storage
    const [startedTasks, setStartedTasks] = useLocalStorage<TaskId[]>(
        "waffles:tasks:started",
        []
    );

    // Track completed tasks (simulated for link tasks, real for invites)
    const [completedTasks, setCompletedTasks] = useLocalStorage<TaskId[]>(
        "waffles:tasks:completed",
        []
    );

    const handleGo = (task: Task) => {
        if (task.type === "invite") {
            onInviteClick();
            return;
        }

        // Open the link
        if (task.actionUrl) {
            window.open(task.actionUrl, "_blank");
        }

        // Mark as started (switches button to "COMPLETE")
        if (!startedTasks.includes(task.id)) {
            setStartedTasks([...startedTasks, task.id]);
        }
    };

    const handleComplete = (task: Task) => {
        if (task.type === "invite") {
            // For invite, this button only appears if logic says so, 
            // but usually it's auto-checked. We'll just notify.
            return;
        }

        // In a real app, verify API here.
        // For now, assume success and mark as completed visually? 
        // Or simply keep it as "COMPLETE" button to show verify state.
        // Per designs, the button state *is* "COMPLETE".

        // Let's verify immediately for demo purposes
        notify.success("Task verified!");
        if (!completedTasks.includes(task.id)) {
            setCompletedTasks([...completedTasks, task.id]);
        }
    };

    return (
        <div className="w-full max-w-[361px] mx-auto flex flex-col gap-6 py-4">
            {TASKS.map((task) => {
                const isStarted = startedTasks.includes(task.id);
                const isCompleted = completedTasks.includes(task.id);

                // Special logic for invite task
                const isInviteTask = task.type === "invite";
                const inviteGoalMet = isInviteTask && invitesCount >= 3;

                // Determine which button state to show
                // 1. If Invite Task: Show COMPLETE if count >= 3, else GO
                // 2. If Link Task: Show COMPLETE if started (clicked GO), else GO
                // 3. If Verified (completedTasks): Maybe hide or show check? (Design only shows GO/COMPLETE)

                let showCompleteButton = false;

                if (isInviteTask) {
                    showCompleteButton = inviteGoalMet;
                } else {
                    showCompleteButton = isStarted;
                }

                if (isCompleted) {
                    // Optional: If you want a "Done" state distinct from "Complete" button
                    // For now, we'll stick to the "COMPLETE" button style as "verified" isn't in the pngs explicitly
                    // Or we can disable the complete button.
                }

                return (
                    <div key={task.id} className="flex items-start gap-4 min-h-[60px]">
                        {/* Icon */}
                        <div className="shrink-0">{task.icon}</div>

                        {/* Text & Action */}
                        <div className="flex-1 flex flex-col justify-center h-full gap-2 pt-1">
                            <p className="font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                                {task.text}
                            </p>

                            {showCompleteButton ? (
                                /* COMPLETE BUTTON (Blue 3D Style) */
                                <button
                                    onClick={() => isInviteTask ? {} : handleComplete(task)}
                                    disabled={isCompleted || (isInviteTask && inviteGoalMet)} // Disable if already verified
                                    className={cn(
                                        "w-[125px] h-[42px] rounded-[12px]",
                                        "bg-[#1B8FF5] text-white",
                                        "border-b-4 border-r-4 border-[#1166B0]", // Darker blue for 3D effect
                                        "font-body font-normal text-[18px] uppercase tracking-[-0.02em]",
                                        "flex items-center justify-center",
                                        "active:border-b-0 active:border-r-0 active:translate-y-[4px] active:translate-x-[4px] transition-all",
                                        isCompleted && "opacity-50 cursor-default border-none translate-y-[4px] translate-x-[4px] bg-green-500" // Optional completed style
                                    )}
                                >
                                    {isCompleted ? "DONE" : "COMPLETE"}
                                </button>
                            ) : (
                                /* GO BUTTON (Cyan Text) */
                                <button
                                    onClick={() => handleGo(task)}
                                    className={cn(
                                        "w-fit font-body font-normal text-[24px] leading-[100%] tracking-normal text-[#00CFF2]",
                                        "hover:opacity-80 transition-opacity text-left"
                                    )}
                                >
                                    GO
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}