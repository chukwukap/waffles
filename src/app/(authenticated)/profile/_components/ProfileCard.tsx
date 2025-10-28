"use client"; // Required for onClick handler

import Image from "next/image"; //
import { UploadIcon } from "@/components/icons"; //
import { cn } from "@/lib/utils"; // Import cn utility

// Define the component's props
interface ProfileCardProps {
  username: string; // User's display name
  streak: number; // Current win streak
  /** URL for the user's avatar image. Also used for the blurred background. */
  avatarUrl: string; //
  /** Optional callback function triggered when the upload button is clicked. */
  onUpload?: () => void; //
}

/**
 * Renders a card displaying the user's profile information, including avatar,
 * username, and current streak, with a blurred background effect.
 * Includes an optional button to trigger an upload action.
 */
export function ProfileCard({
  //
  username, //
  streak, //
  avatarUrl, //
  onUpload, //
}: ProfileCardProps) {
  return (
    <section
      className={cn(
        // Base styles merged with cn
        "relative isolate overflow-hidden rounded-2xl border border-white/10", // Positioning, overflow, styling
        "px-3 py-3 sm:px-4 sm:py-3.5" // Responsive padding
      )}
      aria-label={`${username} profile summary`} // Accessibility label
    >
      {/* Blurred Background Image */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {" "}
        {/* Decorative background */}
        <Image
          src={avatarUrl || "/images/avatars/a.png"} // Use provided URL or fallback
          alt="" // Background is decorative, alt text is empty
          fill // Cover the container
          quality={50} // Lower quality for blurred background
          className="object-cover object-center opacity-70 blur-lg scale-110" // Styling - adjusted blur/scale
          priority // Load eagerly as it's a primary visual element
          // Provide rough sizes hint for optimization
          sizes="(max-width: 640px) 100vw, 640px"
        />
        {/* Subtle Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30" />{" "}
        {/* Adjusted gradient */}
      </div>

      {/* Content Row: Upload Button • Center Block • Spacer */}
      <div className="flex items-start justify-between gap-2">
        {" "}
        {/* */}
        {/* Upload Button (Left) */}
        <button
          onClick={onUpload} // Attach handler
          aria-label="Upload new avatar" // More specific label
          // Disable button visually and functionally if no handler is provided
          disabled={!onUpload}
          className={cn(
            //
            "grid size-9 shrink-0 place-items-center rounded-full bg-white/15", // Styling
            "transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/30", // Interaction states
            !onUpload && "opacity-30 cursor-not-allowed pointer-events-none" // Disabled state styles
          )}
        >
          <UploadIcon className="h-[18px] w-[18px] text-white" /> {/* */}
        </button>
        {/* Center Block: Avatar, Name, Streak */}
        <div className="flex min-w-0 flex-col items-center gap-3">
          {" "}
          {/* */}
          {/* Avatar + Name */}
          <div className="flex items-center gap-2">
            {" "}
            {/* */}
            <Image
              src={avatarUrl || "/images/avatars/a.png"} // Use provided URL or fallback
              alt={`${username}'s avatar`} // Use username in alt text
              width={36} // Fixed size
              height={36} // Fixed size
              className="h-9 w-9 rounded-full bg-white/10 ring-2 ring-black/20 object-cover" // Added object-cover, adjusted bg
              priority // Load avatar eagerly
            />
            {/* Username */}
            <span
              className="font-body text-white tracking-tight" //
              style={{ fontSize: "clamp(1.05rem,2.6vw,1.25rem)" }} // Responsive font size
            >
              {username || "Player"} {/* Display username or fallback */}
            </span>{" "}
            {/* */}
          </div>
          {/* Streak Block */}
          <div className="flex flex-col items-center gap-1">
            {" "}
            {/* */}
            {/* "Streak" Label */}
            <span
              className="font-display text-white/95" //
              style={{
                fontSize: "clamp(.85rem,2vw,1rem)", // Responsive font size
                letterSpacing: "-0.03em", //
              }}
            >
              Streak {/* */}
            </span>
            {/* Flame Icon + Streak Number */}
            <div className="flex items-center gap-2">
              {" "}
              {/* */}
              <Image
                src="/images/icons/streak-flame.svg" // Flame icon
                alt="" // Decorative
                width={20} //
                height={36} //
                className="h-9 w-5 object-contain" // Sizing
              />{" "}
              {/* */}
              <span
                className="font-body text-foreground leading-none tabular-nums" // Added tabular-nums
                style={{ fontSize: "clamp(1.75rem,4.6vw,2.25rem)" }} // Responsive font size
              >
                {streak ?? 0} {/* Display streak or 0 */}
              </span>{" "}
              {/* */}
            </div>{" "}
            {/* */}
          </div>
        </div>
        {/* Right Spacer (for centering balance) */}
        <div
          className="pointer-events-none size-9 shrink-0 opacity-0"
          aria-hidden
        >
          {" "}
          {/* */}
          <UploadIcon className="h-[18px] w-[18px]" /> {/* Mimic button size */}
        </div>
      </div>
    </section>
  );
} //
