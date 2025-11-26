import { Clock } from "@/components/icons";

interface GameStatusHeaderProps {
    statusText: string;
    actionButton: React.ReactNode;
}

export function GameStatusHeader({ statusText, actionButton }: GameStatusHeaderProps) {
    return (
        <div className="flex w-full h-10 min-h-[38px] items-center justify-center gap-0.5 p-2 sm:p-3 my-4">
            <div className="flex h-7 sm:h-[28px] min-w-0 flex-1 items-center gap-2 font-body">
                <Clock
                    className="flex-none h-[28px] w-[28px]"
                    aria-label="Countdown"
                />

                <span className="truncate pl-1 select-none text-white font-normal leading-[0.92] tracking-[-0.03em] text-[26px] font-body">
                    {statusText}
                </span>
            </div>
            {actionButton}
        </div>
    );
}
