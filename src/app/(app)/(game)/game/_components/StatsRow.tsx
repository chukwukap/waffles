"use client";

import Image from "next/image";

interface StatsRowProps {
    spots: number;
    maxSpots?: number;
    prizePool: string;
}

/**
 * Stats display showing Spots and Prize Pool side by side
 * Matches Figma design with emoji-style icons
 */
export function StatsRow({ spots, maxSpots = 100, prizePool }: StatsRowProps) {
    const spotsText = maxSpots ? `${spots}/${maxSpots}` : spots.toString();

    return (
        <div className="flex items-center justify-center gap-12 py-4">
            {/* Spots */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-4xl" role="img" aria-label="Stadium seats">
                    🏟️
                </span>
                <span className="text-white font-body text-lg tracking-tight">
                    {spotsText}
                </span>
                <span className="text-white/50 font-display text-sm">Spots</span>
            </div>

            {/* Prize Pool */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-4xl" role="img" aria-label="Money stack">
                    💵
                </span>
                <span className="text-white font-body text-lg tracking-tight">
                    {prizePool}
                </span>
                <span className="text-white/50 font-display text-sm">Prize pool</span>
            </div>
        </div>
    );
}
