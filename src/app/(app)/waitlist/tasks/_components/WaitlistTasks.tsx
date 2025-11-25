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
    onTaskCompleted: () => void;
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
        iconPath: "/images/icons/x.png", // Placeholder path, user will provide
        title: "Follow on X",
        text: "Follow @playwaffles on X",
        actionUrl: "https://x.com/playwaffles",
        type: "link",
    },
    {
        id: "twitter_rt",
        iconPath: "/images/icons/x.png", // Placeholder path, user will provide
        title: "Retweet Post",
        text: "RT our pinned tweet about Waffles",
        actionUrl: "https://x.com/playwaffles",
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
        actionUrl: "https://warpcast.com/~/compose?text=I%27m%20joining%20Waffles!&embeds[]=https://playwaffles.fun",
        type: "invite",
    },
];

export function WaitlistTasks({
    invitesCount,
    onInviteClick,
    completedTasks,
    fid,
    onTaskCompleted,
}: WaitlistTasksProps) {
    // Track which tasks have been "started" (clicked GO)
    // We use a simple array of TaskIds in local storage
    const [startedTasks, setStartedTasks] = useLocalStorage<TaskId[]>(
        "waffles:tasks:started",
        []
    );

    // Optimistic state for immediate UI update
    const [optimisticCompleted, setOptimisticCompleted] = React.useState<string[]>([]);

    const [state, action, pending] = useActionState<CompleteTaskState, FormData>(
        completeWaitlistTask,
        { success: false }
    );

    useEffect(() => {
        if (state.success && state.message) {
            notify.success(state.message);
            onTaskCompleted();
        } else if (state.error) {
            notify.error(state.error);
            // Revert optimistic update on error
            setOptimisticCompleted((prev) => {
                // We don't know exactly which task failed from the state alone without passing it back,
                // but typically we can just clear the optimistic state or refetch.
                // A better approach if we want to be precise is to track the "pending" task ID.
                // For now, clearing the optimistic state for the failed action is a safe fallback
                // or we can accept that we might clear valid optimistic updates if multiple are in flight (rare here).

                // However, since we don't have the taskId in the error state, 
                // and we only do one at a time, we can just clear the last added one or all.
                // Given the UI blocks multiple simultaneous actions usually, clearing all optimistic 
                // state that isn't yet confirmed by `completedTasks` is reasonable, 
                // OR we can just rely on the user trying again.

                // Actually, to do this correctly without the ID, we should probably return the ID in the state.
                // But to satisfy the request "Revert optimistic update on error", we can clear the optimistic list
                // or at least the one that was likely just added. 

                // Let's clear all optimistic updates to be safe and ensure consistency with server.
                return [];
            });
        }
    }, [state, onTaskCompleted]);

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

        // Optimistically mark as completed
        setOptimisticCompleted((prev) => [...prev, taskId]);

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
                // Check both server data and optimistic state
                const isCompleted = completedTasks.includes(task.id) || optimisticCompleted.includes(task.id);

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
