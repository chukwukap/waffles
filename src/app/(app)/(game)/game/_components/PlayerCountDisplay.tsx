import { AvatarDiamond } from "./AvatarDiamond";

interface PlayerCountDisplayProps {
    mutualsCount: number;
    playerCount: number;
    avatars: Array<{ fid: number; pfpUrl: string | null }>;
}

export function PlayerCountDisplay({ mutualsCount, playerCount, avatars }: PlayerCountDisplayProps) {
    return (
        <div className="w-full flex flex-col items-center justify-center mb-4">
            <AvatarDiamond
                cellMin={32}
                cellMax={54}
                gap={2}
                className="scale-95 sm:scale-100"
                avatars={avatars}
            />
            <p className="mt-1 min-w-[120px] text-center font-display font-medium tracking-[-0.03em] text-muted text-[clamp(13px,4vw,16px)] leading-[130%]">
                {mutualsCount === 0
                    ? playerCount === 0
                        ? "No players have joined yet"
                        : `${playerCount.toLocaleString()} ${playerCount === 1 ? "player has" : "players have"} joined`
                    : `${mutualsCount} friend${mutualsCount === 1 ? "" : "s"} joined`}
            </p>
        </div>
    );
}
