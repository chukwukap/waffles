import Image from "next/image";
import { useState } from "react";

// Helper function to get first letter of username
const getInitial = (name: string): string => {
  return name?.charAt(0)?.toUpperCase() || "?";
};

// Avatar component with fallback to initials
function AvatarWithFallback({ src, name }: { src: string; name: string }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div
        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-semibold"
        style={{
          backgroundColor: "#4F46E5", // Indigo background for initials
        }}
      >
        {getInitial(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name} avatar`}
      width={20}
      height={20}
      className="rounded-full"
      onError={() => setImageError(true)}
    />
  );
}

// Single Comment component
// Single Comment component
export const ChatComment = ({
  name,
  time,
  message,
  avatarUrl,
  isCurrentUser,
  status = "sent",
}: {
  name: string;
  time: string;
  message: string;
  avatarUrl: string | null;
  isCurrentUser?: boolean;
  status?: "pending" | "sent" | "error";
}) => (
  <div className="flex w-full flex-col items-start gap-2">
    {/* User + Time */}
    <div className="flex items-center gap-1.5">
      {avatarUrl ? (
        <AvatarWithFallback src={avatarUrl} name={name} />
      ) : (
        <div
          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-semibold"
          style={{
            backgroundColor: "#4F46E5", // Indigo background for initials
          }}
        >
          {getInitial(name)}
        </div>
      )}
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
    <div
      className={`flex font-display w-full flex-col justify-center rounded-r-lg rounded-bl-lg border border-white/5 bg-white/10 p-3 transition-opacity duration-200
        ${status === "pending" ? "opacity-70" : "opacity-100"}
      `}
    >
      <p
        className="text-sm font-medium text-white break-all"
        style={{ letterSpacing: "-0.03em" }}
      >
        {message}
      </p>
      {status === "error" && (
        <span className="text-[10px] text-red-300 mt-1">Failed to send</span>
      )}
    </div>
  </div>
);
