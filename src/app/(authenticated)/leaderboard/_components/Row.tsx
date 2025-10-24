import { LeaderboardEntry as Entry } from "@/state";
import { UsdcIcon } from "@/components/icons";
import Image from "next/image";

export function Row({ entry }: { entry: Entry }) {
  return (
    <div className="panel flex h-12 items-center justify-between rounded-xl px-4">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
          <span className="text-xs leading-tight">{entry.rank}</span>
        </div>
        <div className="flex items-center gap-2">
          {entry.pfpUrl && (
            <Image
              src={entry.pfpUrl}
              alt={entry.username}
              width={30}
              height={30}
              className="rounded-full bg-[#F0F3F4] object-cover"
              draggable={false}
            />
          )}
          {!entry.pfpUrl && (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
              <span className="text-xs leading-tight">{entry.rank}</span>
            </div>
          )}
          <div className="text-sm leading-tight">{entry.username}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UsdcIcon className="h-4 w-4" />
        <div className="font-display font-medium text-base tracking-tight">
          {entry.points.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
    </div>
  );
}
