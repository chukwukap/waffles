"use client";

import { use } from "react";
import { WaitlistData } from "../../(game)/api/waitlist/route";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTaskActions } from "./_components/useTaskActions";
import { TASKS, WaitlistTask, WaitlistTaskId, TaskStatus } from "@/lib/tasks";

// Re-export types for backwards compatibility
export type { WaitlistTask, WaitlistTaskId, TaskStatus };
export { TASKS };

export function TasksPageClient({ waitlistPromise }: { waitlistPromise: Promise<WaitlistData> }) {
    const waitlistData = use(waitlistPromise);

    // Initialize task actions hook
    const { handleGo, handleComplete, getTaskStatus, isPending } = useTaskActions({
        waitlistData,
    });

    return (

        <div className="w-full max-w-lg mx-auto flex flex-col flex-1 overflow-y-auto px-4 py-6 space-y-3">
            {TASKS.map((task) => {
                const status = getTaskStatus(task);
                const isCompleted = status === "completed";
                const isPendingTask = status === "pending";
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
                            isCompleted && "opacity-50",
                            isPending && "animate-pulse border-[#00CFF2]/50"
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

                        {/* Points Badge - only show when not in initial state */}
                        {!isInitial && (
                            <div className={cn(
                                "absolute top-2 right-2 font-body font-normal text-[20px] leading-none",
                                isCompleted ? "text-[#99A0AE]" : "text-[#00CFF2]"
                            )}>
                                +{task.points}
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

                            {isPendingTask && (
                                <button
                                    onClick={() => handleComplete(task.id)}
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
                                onClick={() => handleGo(task)}
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
