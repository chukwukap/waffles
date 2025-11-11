// hooks/useGamePhase.ts
import { useState, useCallback } from "react";

type Phase = "question" | "extra" | "round";

export function useGamePhase(config: {
  questionTime: number;
  extraTime: number;
  roundTime: number;
  totalQuestions: number;
  questionsPerRound: number;
}) {
  const {
    questionTime,
    extraTime,
    roundTime,
    totalQuestions,
    questionsPerRound,
  } = config;

  const [phase, setPhase] = useState<Phase>("question");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);

  const handleQuestionDone = useCallback(() => {
    setPhase("extra");
  }, []);

  const handleExtraDone = useCallback(() => {
    const nextQuestion = questionIndex + 1;

    const isEndOfRound = nextQuestion % questionsPerRound === 0;
    const isEndOfGame = nextQuestion >= totalQuestions;

    if (isEndOfGame) {
      setPhase("round");
      return;
    }

    if (isEndOfRound) {
      setPhase("round");
      return;
    }

    setQuestionIndex(nextQuestion);
    setPhase("question");
  }, [questionIndex, questionsPerRound, totalQuestions]);

  const handleRoundDone = useCallback(() => {
    const nextQuestion = questionIndex + 1;
    const nextRound = roundIndex + 1;

    // Start next question
    setQuestionIndex(nextQuestion);
    setRoundIndex(nextRound);
    setPhase("question");
  }, [questionIndex, roundIndex]);

  return {
    phase,
    questionIndex,
    roundIndex,
    handleQuestionDone,
    handleExtraDone,
    handleRoundDone,
  };
}
