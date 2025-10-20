type User = {
  rank: number;
  name: string;
  avatar: React.ReactNode;
  score: number;
};

interface UserRowProps {
  user: User;
}

export function UserRow({ user }: UserRowProps) {
  const rankColor =
    user.rank === 1
      ? "text-rank-1"
      : user.rank === 2
      ? "text-rank-2"
      : user.rank === 3
      ? "text-rank-3"
      : "text-text-secondary";

  return (
    <li className="flex items-center justify-between py-3 px-4 text-sm">
      <div className="flex items-center gap-4">
        <span className={`w-6 text-center font-bold ${rankColor}`}>
          {user.rank}
        </span>
        <div className="flex items-center gap-3">
          {user.avatar}
          <span className="font-bold uppercase tracking-wider">
            {user.name}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Replace with coin icon later */}
        <div className="size-5 rounded-full bg-blue-500" />
        <span className="font-bold">
          {user.score.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </li>
  );
}
