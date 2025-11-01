"use client";

import React, { useEffect } from "react";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GameErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Game Segment Error:", error);
  }, [error]);

  return (
    <div
      className="
        flex flex-col items-center justify-center
        min-h-[80dvh]
        w-full px-4 sm:px-8 py-8
        text-center
        text-foreground
       
      "
      style={{
        minHeight: "80dvh",
      }}
    >
      <h1
        className="
          text-[clamp(1.5rem,5vw,2.25rem)]
          font-body font-bold text-red-500 mb-2 sm:mb-3
          leading-tight
        "
      >
        Oops! Waffle Down!
      </h1>
      <p
        className="
          mb-5 sm:mb-6 text-[clamp(1rem,3vw,1.15rem)]
          text-muted-foreground font-display
          max-w-[92vw] sm:max-w-md 
          mx-auto
          leading-snug
        "
      >
        Sorry, there was a problem loading or running the game. Please try
        again.
      </p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre
          className="
            mb-5 sm:mb-6
            text-xs sm:text-sm
            text-red-300
            bg-red-900/20
            p-2 sm:p-3
            rounded
            max-w-full
            w-full sm:w-auto
            overflow-x-auto
            font-mono
            text-left
            wrap-break-word
          "
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
          {error.stack &&
            `\n\nStack Trace:\n${error.stack.substring(0, 500)}...`}
        </pre>
      )}
      <div className="w-full flex justify-center">
        <FancyBorderButton
          onClick={reset}
          className="
            w-full max-w-xs sm:max-w-sm
            py-3 px-3 sm:px-5
            text-base sm:text-lg
          "
        >
          Try Again
        </FancyBorderButton>
      </div>
    </div>
  );
}
