"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveGame } from "./LiveGameProvider";
import { useTimer } from "@/hooks/useTimer";
import { playSound } from "@/lib/sounds";
import QuestionView from "./_components/QuestionView";
import BreakView from "./_components/BreakView";
import GameCountdownScreen from "./_components/GameCountdownScreen";
import GameCompleteScreen from "./_components/GameCompleteScreen";
import { CheerOverlay } from "../../_components/CheerOverlay";
import { WaffleLoader } from "@/components/ui/WaffleLoader";
import sdk from "@farcaster/miniapp-sdk";

interface UserData {
    fid: number;
    username: string;
    pfpUrl: string;
}

interface LeaderboardEntry {
    username: string;
    pfpUrl: string | null;
    score: number;
}

interface UserScore {
    score: number;
    rank: number;
    winnings: number;
    percentile: number;
}

/**
 * LiveGameScreen - Main orchestrator
 * 
 * Shows countdown video on first visit, then routes to QuestionView, BreakView, or GameCompleteScreen.
 */
export default function LiveGameScreen() {
    // Show countdown every time user enters the live game
    const [showCountdown, setShowCountdown] = useState(true);

    const handleCountdownComplete = () => {
        setShowCountdown(false);
    };

    // Show countdown screen before game
    if (showCountdown) {
        return <GameCountdownScreen onComplete={handleCountdownComplete} />;
    }

    return <LiveGameContent />;
}

/**
 * LiveGameContent - Actual game logic
 */
function LiveGameContent() {
    const {
        isBreak,
        timerTarget,
        questionIndex,
        questions,
        advance,
        isGameComplete,
        gameId,
        prizePool,
        gameTheme,
    } = useLiveGame();

    // Timer - calls advance when complete
    const seconds = useTimer(timerTarget, advance);
    const prevSeconds = useRef(seconds);

    // State for game complete screen
    const [userData, setUserData] = useState<UserData | null>(null);
    const [userScore, setUserScore] = useState<UserScore | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoadingComplete, setIsLoadingComplete] = useState(false);

    // Play timer sounds at key moments
    useEffect(() => {
        // Play final countdown sound when entering last 3 seconds (only during questions)
        if (!isBreak && prevSeconds.current > 3 && seconds === 3) {
            playSound("timerFinal");
        }
        // Play time up sound when timer hits 0
        if (prevSeconds.current > 0 && seconds === 0) {
            playSound("timeUp");
        }
        prevSeconds.current = seconds;
    }, [seconds, isBreak]);

    // Fetch complete screen data when game ends
    useEffect(() => {
        if (!isGameComplete) return;

        async function fetchCompleteData() {
            setIsLoadingComplete(true);
            try {
                // Fetch user info
                const userRes = await sdk.quickAuth.fetch("/api/v1/me");
                if (userRes.ok) {
                    const user = await userRes.json();
                    setUserData({
                        fid: user.fid,
                        username: user.username ?? "Player",
                        pfpUrl: user.pfpUrl ?? "",
                    });

                    // Fetch leaderboard
                    const lbRes = await sdk.quickAuth.fetch(
                        `/api/v1/games/${gameId}/leaderboard?limit=50`
                    );
                    if (lbRes.ok) {
                        const lbData = await lbRes.json();
                        const entries: LeaderboardEntry[] = lbData.leaderboard.map(
                            (e: { username: string | null; pfpUrl: string | null; score: number }) => ({
                                username: e.username ?? "anon",
                                pfpUrl: e.pfpUrl,
                                score: e.score,
                            })
                        );
                        setLeaderboard(entries);

                        // Find user's position
                        const userIndex = lbData.leaderboard.findIndex(
                            (p: { fid: number }) => p.fid === user.fid
                        );

                        if (userIndex !== -1) {
                            const player = lbData.leaderboard[userIndex];
                            const total = lbData.leaderboard.length;
                            const rank = userIndex + 1;
                            const percentile =
                                total > 1
                                    ? Math.round(((total - rank) / (total - 1)) * 100)
                                    : 100;

                            // Calculate winnings based on rank and prizePool
                            const prizeDistribution = [0.6, 0.3, 0.1];
                            const winnings =
                                rank <= 3
                                    ? prizePool * (prizeDistribution[rank - 1] || 0)
                                    : 0;

                            setUserScore({
                                score: player.score,
                                rank,
                                winnings,
                                percentile: Math.max(0, Math.min(100, percentile)),
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching complete data:", error);
            } finally {
                setIsLoadingComplete(false);
            }
        }

        fetchCompleteData();
    }, [isGameComplete, gameId, prizePool]);

    // Show game complete screen when finished
    if (isGameComplete) {
        if (isLoadingComplete || !userData || !userScore) {
            return (
                <div className="flex-1 flex items-center justify-center">
                    <WaffleLoader text="CALCULATING RESULTS..." />
                </div>
            );
        }

        return (
            <GameCompleteScreen
                score={userScore.score}
                rank={userScore.rank}
                winnings={userScore.winnings}
                percentile={userScore.percentile}
                username={userData.username}
                pfpUrl={userData.pfpUrl}
                gameTheme={gameTheme}
                leaderboard={leaderboard}
                gameId={gameId}
            />
        );
    }

    // Get current question
    const currentQuestion = questions[questionIndex];

    if (!currentQuestion) {
        return null;
    }

    if (isBreak) {
        const nextQuestion = questions[questionIndex + 1] ?? questions[0];
        return (
            <>
                <div className="flex-1 flex flex-col min-h-0">
                    <BreakView
                        seconds={seconds}
                        nextRoundNumber={nextQuestion?.roundIndex ?? 1}
                    />
                </div>
                <CheerOverlay />
            </>
        );
    }

    return (
        <>
            <QuestionView
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={questions.length}
                seconds={seconds}
            />
            <CheerOverlay />
        </>
    );
}
