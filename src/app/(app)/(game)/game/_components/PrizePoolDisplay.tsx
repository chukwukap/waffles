interface PrizePoolDisplayProps {
    formattedPrizePool: string;
}

export function PrizePoolDisplay({ formattedPrizePool }: PrizePoolDisplayProps) {
    return (
        <div className="flex flex-col items-center justify-center mb-2">
            <p className="font-display font-medium text-[16px] leading-[130%] tracking-[-0.03em] text-center text-(--text-soft-400,#99A0AE)">
                Current prize pool
            </p>
            <span className="block text-[64px] text-center font-normal not-italic leading-[0.92] tracking-[-0.03em] text-[#14B985] font-body">
                {formattedPrizePool}
            </span>
        </div>
    );
}
