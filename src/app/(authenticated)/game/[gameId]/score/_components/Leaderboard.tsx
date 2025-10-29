import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";

interface Entry {
  username: string;
  avatarUrl?: string | null;
  score: number;
}

interface Props {
  entries: Entry[];
  className?: string;
}

export default function Leaderboard({ entries, className }: Props) {
  return (
    <div
      className={clsx("w-full max-w-[360px] flex flex-col gap-3", className)}
    >
      <div className="flex justify-between items-center">
        <h2 className="font-pixel text-[22px]">TOP 3 FINISHERS</h2>
        <Link
          href="/leaderboard"
          className="text-[#00CFF2] font-pixel text-[18px]"
        >
          VIEW LEADERBOARD
        </Link>
      </div>

      {entries.map((e, i) => (
        <div
          key={e.username}
          className={clsx(
            "flex justify-between items-center rounded-2xl p-3 border border-white/10",
            i === 0 && "bg-gradient-to-r from-green-400/20 to-green-300/5",
            i === 1 && "bg-gradient-to-r from-blue-400/20 to-blue-300/5",
            i === 2 && "bg-gradient-to-r from-orange-400/20 to-orange-300/5"
          )}
        >
          <div className="flex items-center gap-3">
            <Image
              src={e.avatarUrl ?? "/images/avatar-default.png"}
              width={32}
              height={32}
              alt=""
              className="rounded-full"
            />
            <p className="font-pixel text-[18px]">{e.username}</p>
          </div>
          <p className="font-pixel text-[20px]">{e.score}</p>
        </div>
      ))}
    </div>
  );
}
