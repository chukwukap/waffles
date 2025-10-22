"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useAuthStore } from "@/stores/authStore";

export default function GamePage() {
  const {
    questions,
    current,
    fetchQuestions,
    answerQuestion,
    nextQuestion,
    timeLeft,
    status,
    score,
  } = useGameStore();
  const { fid } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [timerStart, setTimerStart] = useState<number>(0);

  useEffect(() => {
    fetchQuestions();
    setTimerStart(Date.now());
  }, [fetchQuestions]);

  const handleAnswer = async (option: string) => {
    if (!questions[current]) return;
    const timeTaken = (Date.now() - timerStart) / 1000;
    setSelected(option);
    await answerQuestion(questions[current].id, option, timeTaken);
    setTimeout(() => {
      setSelected(null);
      nextQuestion();
      setTimerStart(Date.now());
    }, 1000);
  };

  if (status === "ended") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-3xl font-bold text-green-400">Game Over!</h1>
        <p className="text-xl">Your Score: {score}</p>
        <a href="/leaderboard" className="text-blue-400 underline">
          View Leaderboard →
        </a>
      </main>
    );
  }

  const q = questions[current];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-white bg-gradient-to-b from-zinc-900 to-black">
      {q ? (
        <>
          <h1 className="text-2xl font-bold text-center">{q.text}</h1>

          <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={!!selected}
                className={`px-4 py-3 rounded-lg text-left ${
                  selected === opt
                    ? opt === q.correctAnswer
                      ? "bg-green-600"
                      : "bg-red-600"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center mt-4">
            <p className="text-lg font-mono">{timeLeft}s</p>
            <p className="text-gray-400 text-sm">Score: {score}</p>
          </div>
        </>
      ) : (
        <p>Loading questions...</p>
      )}
    </main>
  );
}
