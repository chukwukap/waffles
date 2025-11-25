
import { cn } from "@/lib/utils";
import Image from "next/image";

export type TaskId =
    | "discord_join"
    | "twitter_follow"
    | "twitter_rt"
    | "farcaster_follow"
    | "farcaster_share"
    | "invite_friends";

export interface Task {
    id: TaskId;
    iconPath: string; // Changed from icon: React.ReactNode to iconPath: string
    title: string;
    text: string;
    actionUrl?: string;
    actionLabel?: string;
    type: "link" | "invite";
}

interface TaskCardProps {
    task: Task;
    isStarted: boolean;
    isCompleted: boolean;
    invitesCount: number;
    fid: number | undefined;
    onGo: (task: Task) => void;
    onComplete: (taskId: string) => void;
}

export function TaskCard({
    task,
    isStarted,
    isCompleted,
    invitesCount,
    fid,
    onGo,
    onComplete,
}: TaskCardProps) {
    // Special logic for invite task
    const isInviteTask = task.type === "invite";
    const inviteGoalMet = isInviteTask && invitesCount >= 3;

    // Determine if we should show the "COMPLETE" button
    // If completed, we show NOTHING (no button)
    // If invite task: show button only if goal met AND not completed (though usually auto-completes)
    // If link task: show button if started AND not completed
    let showCompleteButton = false;
    let showGoButton = false;

    if (isCompleted) {
        // Completed state: No buttons
        showCompleteButton = false;
        showGoButton = false;
    } else if (isInviteTask) {
        if (inviteGoalMet) {
            showCompleteButton = true;
        } else {
            // Invite task that isn't met yet
            showCompleteButton = false;
            showGoButton = false;
        }
    } else {
        // Link task
        if (isStarted) {
            showCompleteButton = true;
        } else {
            showGoButton = true;
        }
    }

    return (
        <div
            className={cn(
                "flex items-center justify-center gap-[12px] px-[12px] py-[8px] rounded-[16px]",
                "bg-[#FFFFFF08] border border-[#FFFFFF14]",
                " transition-all duration-300",
                // Interaction: Hover effect on card
                !isCompleted && "hover:border-white/30 hover:bg-[#FFFFFF0C]",

                // Height adjustment
                showCompleteButton || showGoButton ? "h-[109px]" : "h-[86px]",
                // Gray out if completed
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

            {/* Text*/}
            <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-0.5">
                    {/* Title */}
                    <p
                        className={cn(
                            "font-body font-normal text-[20px] leading-[130%] tracking-normal",
                            isCompleted
                                ? "text-white line-through decoration-white decoration-2" // Added explicit decoration styles
                                : "text-white"
                        )}
                    >
                        {task.title}
                    </p>
                    {/* Description */}
                    <p
                        className={cn(
                            "font-display font-medium leading-[130%] tracking-[-0.03em]",
                            "text-[14px] text-[#99A0AE]"
                        )}
                    >
                        {task.text}
                    </p>
                </div>

                {showCompleteButton && (
                    /* COMPLETE BUTTON */
                    <button
                        onClick={() => onComplete(task.id)}
                        className={cn(
                            "w-[96px] h-[29px] rounded-[8px]",
                            "bg-white text-[#1B8FF5]",
                            "border-b-[3px] border-r-[3px] border-[#1B8FF5]",
                            "font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em]",
                            "flex items-center justify-center text-center pb-1",
                            "transition-all duration-200",
                            "active:border-b-0 active:border-r-0 active:translate-y-[3px] active:translate-x-[3px]",
                            "hover:brightness-95" // Hover effect
                        )}
                    >
                        COMPLETE
                    </button>
                )}
            </div>
            {showGoButton && (
                /* GO BUTTON */
                <button
                    onClick={() => onGo(task)}
                    className={cn(
                        "w-fit font-body font-normal text-[24px] leading-[100%] tracking-normal text-[#00CFF2]",
                        "hover:opacity-80 transition-all duration-200 text-left",
                        "hover:translate-x-1" // Hover effect
                    )}
                >
                    GO
                </button>
            )}
        </div>
    );
}
