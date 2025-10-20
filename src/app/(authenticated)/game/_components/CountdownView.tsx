"use client";

import { useGameStore } from "@/stores/gameStore";

const CountdownView = () => {
  const roundTimer = useGameStore((state) => state.roundTimer);
  const initialTime = 15; // Or get from store if dynamic
  const circumference = 2 * Math.PI * 56; // 2 * pi * radius
  const strokeDashoffset =
    circumference - (roundTimer / initialTime) * circumference;

  return (
    <div className="flex flex-col items-center justify-center text-center w-full">
      <p className="font-edit-undo text-sm text-gray-400 mb-4">PLEASE WAIT</p>
      <h2 className="font-edit-undo text-3xl mb-4">NEXT ROUND IN</h2>
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg className="absolute w-full h-full" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="56"
            stroke="#1E1E1E"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="56"
            stroke="#00CFF2"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s linear",
            }}
          />
        </svg>
        <span className="font-edit-undo text-6xl text-white z-10">
          {roundTimer}
        </span>
      </div>
      <p className="mt-6 text-lg">Get ready for the next round!</p>
    </div>
  );
};

export default CountdownView;
