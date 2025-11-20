"use client";

import React, { useActionState, startTransition, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { notify } from "@/components/ui/Toaster";
import { TaskCard, Task, TaskId } from "./TaskCard";
import { completeWaitlistTask, CompleteTaskState } from "@/actions/waitlist";

interface WaitlistTasksProps {
    invitesCount: number;
    onInviteClick: () => void;
    completedTasks: string[]; // IDs of completed tasks from API
    fid: number | undefined;
}

// Hardcoded task definitions
const TASKS: Task[] = [
    {
        id: "discord_join",
        iconPath: "/images/icons/discord.png", // Placeholder path, user will provide
        title: "Join Discord Community",
        text: "Join our Discord server and say hi in #general",
        actionUrl: "https://discord.gg/waffles",
        type: "link",
    },
    {
        id: "twitter_follow",
        iconPath: "/images/icons/twitter.png", // Placeholder path, user will provide
        title: "Follow on Twitter",
        text: "Follow @Wafflesdotfun on Twitter",
        actionUrl: "https://twitter.com/Wafflesdotfun",
        type: "link",
    },
    {
        id: "twitter_rt",
        iconPath: "/images/icons/twitter.png", // Placeholder path, user will provide
        title: "Retweet Post",
        text: "RT our pinned tweet about Waffles",
        actionUrl: "https://twitter.com/Wafflesdotfun",
        type: "link",
    },
    {
        id: "farcaster_follow",
        iconPath: "/images/icons/farcaster.png",
        title: "Follow on Farcaster",
        text: "Follow @waffles on Farcaster",
        actionUrl: "https://warpcast.com/waffles",
        type: "link",
    },
    {
        id: "farcaster_share",
        iconPath: "/images/icons/farcaster.png",
        title: "Share on Farcaster",
        text: "Share Waffles on Farcaster with #Waffles",
        actionUrl: "https://warpcast.com/~/compose?text=I%27m%20joining%20Waffles!&embeds[]=https://playwaffles.fun",
        type: "link",
    },
    {
        id: "invite_friends",
        iconPath: "/images/icons/invite.png", // Placeholder path, user will provide
        title: "Invite Friends",
        text: "Get 3 friends to join the waitlist",
        type: "invite",
    },
];

export function WaitlistTasks({
    invitesCount,
    onInviteClick,
    completedTasks,
    fid,
}: WaitlistTasksProps) {
    // Track which tasks have been "started" (clicked GO)
    // We use a simple array of TaskIds in local storage
    const [startedTasks, setStartedTasks] = useLocalStorage<TaskId[]>(
        "waffles:tasks:started",
        []
    );

    const [state, action, pending] = useActionState<CompleteTaskState, FormData>(
        completeWaitlistTask,
        { success: false }
    );

    useEffect(() => {
        if (state.success && state.message) {
            notify.success(state.message);
            // The parent component should refetch waitlist data to update completedTasks
        } else if (state.error) {
            notify.error(state.error);
        }
    }, [state]);

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

    const handleComplete = (taskId: string) => {
        if (!fid) {
            notify.error("User not identified");
            return;
        }

        const formData = new FormData();
        formData.append("fid", fid.toString());
        formData.append("taskId", taskId);

        startTransition(() => {
            action(formData);
        });
    };

    return (
        <div className="w-full max-w-[361px] mx-auto flex flex-col gap-4 py-4">
            {TASKS.map((task) => {
                const isStarted = startedTasks.includes(task.id);
                const isCompleted = completedTasks.includes(task.id);

                return (
                    <TaskCard
                        key={task.id}
                        task={task}
                        isStarted={isStarted}
                        isCompleted={isCompleted}
                        invitesCount={invitesCount}
                        fid={fid}
                        onGo={handleGo}
                        onComplete={handleComplete}
                    />
                );
            })}
        </div>
    );
}
