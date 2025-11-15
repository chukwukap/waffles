import Image from "next/image";

// Single Comment component
export const ChatComment = ({
  name,
  time,
  message,
  avatarUrl,
}: {
  name: string;
  time: string;
  message: string;
  avatarUrl: string;
}) => (
  <div className="flex w-full flex-col items-start gap-2">
    {/* User + Time */}
    <div className="flex items-center gap-1.5">
      {/* Replaced Next/Image with standard <img> tag */}
      <Image
        src={avatarUrl}
        alt={`${name} avatar`}
        width={20}
        height={20}
        className="rounded-full"
      />
      <span
        className="text-sm font-medium text-white"
        style={{ letterSpacing: "-0.03em" }}
      >
        {name}
      </span>
      <span className="h-0.5 w-0.5 rounded-full bg-gray-400"></span>
      <span
        className="text-[10px] font-medium text-gray-400"
        style={{ letterSpacing: "-0.03em" }}
      >
        {time}
      </span>
    </div>
    {/* Comment Body */}
    <div className="flex font-display w-full flex-col justify-center rounded-r-lg rounded-bl-lg border border-white/5 bg-white/10 p-3">
      <p
        className="text-sm font-medium text-white"
        style={{ letterSpacing: "-0.03em" }}
      >
        {message}
      </p>
    </div>
  </div>
);
