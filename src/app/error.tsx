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
    <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-6  text-foreground">
      <h1 className="text-2xl font-body font-bold text-red-500 mb-3">
        Oops! Waffle Down!
      </h1>
      <p className="mb-6 text-muted-foreground font-display max-w-md">
        Sorry, there was a problem loading or running the game. Please try
        again.
      </p>
      {process.env.NODE_ENV === "development" && error?.message && (
        <pre className="mb-6 text-xs text-red-300 bg-red-900/20 p-3 rounded max-w-full overflow-x-auto">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
          {error.stack &&
            `\n\nStack Trace:\n${error.stack.substring(0, 500)}...`}
        </pre>
      )}
      <FancyBorderButton onClick={() => reset()} className="max-w-xs">
        Try Again
      </FancyBorderButton>
    </div>
  );
}
