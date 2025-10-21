import { LeaderboardUser } from "@/app/api/leaderboard/route";
import { UsdcIcon } from "@/components/icons";
import Image from "next/image";

export function Row({ user }: { user: LeaderboardUser }) {
  return (
    <div className="panel flex h-12 items-center justify-between rounded-xl px-4">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
          <span className="text-xs leading-tight">{user.rank}</span>
        </div>
        <div className="flex items-center gap-2">
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={30}
            height={30}
            className="rounded-full bg-[#F0F3F4] object-cover"
            draggable={false}
          />
          <div className="text-sm leading-tight">{user.name}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UsdcIcon className="h-4 w-4" />
        <div className="font-display font-medium text-base tracking-tight">
          {user.score.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    </div>
  );
}
