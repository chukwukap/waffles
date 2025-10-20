"use client";

import Image from "next/image";
import { useGameStore } from "@/stores/gameStore";
import QuestionStatusBar from "./QuestionStatusBar";
import { PixelButton } from "@/components/buttons/PixelButton";
import { cn } from "@/lib/utils";

const QuestionView = () => {
  const { currentQuestion, selectedAnswer, gameState } = useGameStore(
    (state) => ({
      currentQuestion: state.currentQuestion,
      selectedAnswer: state.selectedAnswer,
      gameState: state.gameState,
    })
  );

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  const answerColors = ["yellow", "purple", "blue", "green"];

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">
      <QuestionStatusBar />
      <h1 className="font-edit-undo text-3xl text-white my-2">
        {currentQuestion.questionText}
      </h1>
      <div className="w-[250px] h-[250px] bg-gray-700 rounded-lg overflow-hidden">
        <Image
          src={currentQuestion.imageUrl}
          alt="Question Image"
          width={250}
          height={250}
          className="object-cover"
        />
      </div>
      <div className="flex flex-col items-center gap-3 w-[300px] mt-6">
        {currentQuestion.options.map((option, index) => (
          <PixelButton
            key={option.id}
            onClick={() => useGameStore.getState().selectAnswer(option.id)}
            disabled={gameState === "ANSWER_SUBMITTED"}
            className={cn(
              "w-full",
              selectedAnswer === option.id && "bg-gray-700",
              gameState === "ANSWER_SUBMITTED" && "opacity-50",
              answerColors[index % answerColors.length]
            )}
          >
            {option.text}
          </PixelButton>
        ))}
      </div>
      {gameState === "ANSWER_SUBMITTED" && (
        <p className="font-brockmann text-text-muted text-center mt-4">
          Answer submitted! Wait for the next question...
        </p>
      )}
    </div>
  );
};

export default QuestionView;
