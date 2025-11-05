"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import SoundManager from "@/lib/SoundManager";
import { useUserPreferences } from "@/components/providers/userPreference";
import { NeccessaryGameInfo, NeccessaryUserInfo } from "./page";

// Dynamically import views
import QuestionView from "./_components/QuestionView";
import WaitingView from "./_components/WaitingView";
import JoinGameView from "./_components/JoinGameView";
import RoundCountdownView from "./_components/RoundCountdownView";

interface GameClientImplProps {
  gameInfoPromise: Promise<NeccessaryGameInfo | null>;
  userInfoPromise: Promise<NeccessaryUserInfo | null>;
}

/**
 * This component acts as the main client-side state machine for the game.
 * It consumes data fetched on the server and decides which view to render:
 * - WaitingView: If the game has not started yet.
 * - JoinGameView: If the user hasn't joined the active game.
 * - RoundCountdownView: If a new round (except the first) is starting.
 * - QuestionView: If the user is actively playing a question.
 * - Spinner: If the game is over and redirecting to the score page.
 */
export function GameClientImpl({
  gameInfoPromise,
  userInfoPromise,
}: GameClientImplProps) {
  const gameInfo = use(gameInfoPromise);
  const userInfo = use(userInfoPromise);
  const { prefs } = useUserPreferences();
  const router = useRouter();

  const questionIdx = userInfo?._count.answers ?? 0;

  // This state controls the transition from RoundCountdownView to QuestionView
  const [showCurrentQuestion, setShowCurrentQuestion] = useState(false);

  // ───────────────────────── EFFECTS ─────────────────────────

  useEffect(() => {
    // --- Game Over Redirect ---
    // If game/user info is loaded, questions exist, and answers match total questions
    if (
      gameInfo &&
      userInfo &&
      gameInfo.questions.length > 0 &&
      gameInfo.questions.length === userInfo._count.answers
    ) {
      // Redirect to score page
      router.push(`/game/${gameInfo.id}/score?fid=${userInfo.fid}`);
    }
  }, [gameInfo, userInfo, router]);

  useEffect(() => {
    // --- Sound Initialization ---
    if (!prefs.soundEnabled) return;
    // Init sound manager on first user interaction
    const handleInteraction = () => {
      SoundManager.init().catch(() => {
        console.error("Failed to initialize sound");
      });
    };
    window.addEventListener("pointerdown", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [prefs.soundEnabled]);

  useEffect(() => {
    // --- Sound Cleanup ---
    // Stop all sounds when this component unmounts
    return () => {
      SoundManager.stopAll();
    };
  }, []);

  useEffect(() => {
    // --- Round Countdown State Management ---
    // This effect runs when the question index changes (e.g., after an answer)
    if (!gameInfo || !userInfo) return;

    const currentQuestion = gameInfo.questions[questionIdx];
    const prevQuestion =
      questionIdx > 0 ? gameInfo.questions[questionIdx - 1] : null;
    const now = Date.now();
    const start = gameInfo.startTime.getTime();
    const end = gameInfo.endTime.getTime();
    const isActive = now >= start && now <= end;

    // Check if it's the start of a new round (but not the very first round)
    const isFirstQuestionOfNewRound =
      isActive &&
      questionIdx > 0 &&
      currentQuestion &&
      prevQuestion &&
      currentQuestion.round.roundNum > prevQuestion.round.roundNum;

    // We reset the state here.
    // If it's a new round, set to `false` (to *show* the countdown).
    // Otherwise, set to `true` (to *hide* the countdown and show the question).
    setShowCurrentQuestion(!isFirstQuestionOfNewRound);
  }, [questionIdx, gameInfo, userInfo]);

  // ───────────────────────── RENDER LOGIC ─────────────────────────

  // Show nothing if data is still loading (should be handled by Suspense)
  if (!gameInfo || !userInfo) {
    return <Spinner />;
  }

  // --- Game Over State ---
  // Check if game is over (redirect is handled by useEffect)
  if (
    gameInfo.questions.length > 0 &&
    gameInfo.questions.length === questionIdx
  ) {
    // Show spinner while redirecting
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // --- Pre-Game States ---
  const now = Date.now();
  const start = gameInfo.startTime.getTime();
  const end = gameInfo.endTime.getTime();
  const isParticipant = userInfo._count.gameParticipants > 0;
  const isWaiting = now < start;
  const isActive = now >= start && now <= end;

  if (isWaiting) {
    return <WaitingView gameInfo={gameInfo} />;
  }

  if (!isParticipant) {
    return (
      <JoinGameView gameInfo={gameInfo} userInfo={userInfo} friends={[]} />
    );
  }

  // --- Active Game States ---
  const currentQuestion = gameInfo.questions[questionIdx];
  const prevQuestion =
    questionIdx > 0 ? gameInfo.questions[questionIdx - 1] : null;

  // Check if we are at the start of a new round
  const isFirstQuestionOfNewRound =
    isActive &&
    questionIdx > 0 &&
    currentQuestion &&
    prevQuestion &&
    currentQuestion.round.roundNum > prevQuestion.round.roundNum;

  // 1. Show Round Countdown
  if (isFirstQuestionOfNewRound && !showCurrentQuestion) {
    return (
      <RoundCountdownView
        gameInfo={gameInfo}
        onCountDownEnd={() => {
          setShowCurrentQuestion(true); // After countdown, show the question
        }}
      />
    );
  }

  // 2. Show Question
  // This runs if:
  // - It's the first round (isFirstQuestionOfNewRound is false)
  // - Or, the round countdown has finished (showCurrentQuestion is true)
  if (isActive && currentQuestion) {
    return <QuestionView gameInfo={gameInfo} userInfo={userInfo} />;
  }

  // --- Fallback State ---
  // e.g., Game ended but redirect hasn't fired, or no questions found
  return <WaitingView gameInfo={gameInfo} />;
}
