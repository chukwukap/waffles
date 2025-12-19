"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { FlashIcon, TrendIcon } from "@/components/icons";
import { playSound } from "@/lib/sounds";
import { useEffect, useRef } from "react";
import { env } from "@/lib/env";

// Trophy SVGs for top 3 positions
const TROPHY_PATHS = [
    "/images/trophies/gold.svg",
    "/images/trophies/silver.svg",
    "/images/trophies/bronze.svg",
];

// Background gradient themes for leaderboard
const THEMES = [
    "bg-gradient-to-r from-transparent to-[rgba(52,199,89,0.12)]",
    "bg-gradient-to-r from-transparent to-[rgba(25,171,211,0.12)]",
    "bg-gradient-to-r from-transparent to-[rgba(211,77,25,0.12)]",
];

interface LeaderboardEntry {
    username: string;
    pfpUrl: string | null;
    score: number;
}

interface GameCompleteScreenProps {
    score: number;
    rank: number;
    winnings: number;
    percentile: number;
    username: string;
    pfpUrl: string;
    gameTheme: string;
    leaderboard: LeaderboardEntry[];
    gameId: number;
}

export default function GameCompleteScreen({
    score,
    rank,
    winnings,
    percentile,
    username,
    pfpUrl,
    gameTheme,
    leaderboard,
    gameId,
}: GameCompleteScreenProps) {
    const hasPlayedSound = useRef(false);

    // Play victory or defeat sound
    useEffect(() => {
        if (!hasPlayedSound.current) {
            hasPlayedSound.current = true;
            playSound(rank <= 3 ? "victory" : "defeat");
        }
    }, [rank]);

    const { composeCastAsync } = useComposeCast();

    const handleShare = useCallback(async () => {
        try {
            const message = `I scored ${score.toLocaleString()} points and ranked #${rank} in Waffles! 🧇`;
            const result = await composeCastAsync({
                text: message,
                embeds: [
                    `${env.rootUrl}/game/${gameId}/result`,
                ].filter(Boolean) as [],
            });

            if (result?.cast) {
                console.log("Cast created successfully:", result.cast.hash);
            }
        } catch (e) {
            console.error("Share failed:", e);
        }
    }, [composeCastAsync, score, rank, gameId]);

    return (
        <div className="w-full px-4 text-white flex flex-col items-center flex-1 overflow-y-auto pb-8">
            {/* Header: Waffle + Title + Theme */}
            <div className="flex flex-col justify-center items-center gap-2 w-[315px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 0.1,
                    }}
                >
                    <Image
                        src="/images/illustrations/waffles.svg"
                        alt="waffle"
                        width={228}
                        height={132}
                    />
                </motion.div>

                <motion.h1
                    className="font-body text-[44px] leading-[92%] text-center tracking-[-0.03em] text-white w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    GAME OVER
                </motion.h1>

                <motion.div
                    className="flex flex-row justify-center items-center gap-2.5 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <p className="font-display font-medium text-[16px] leading-[130%] text-center tracking-[-0.03em] text-[#99A0AE] capitalize">
                        {gameTheme?.toLowerCase() ?? "trivia"}
                    </p>
                </motion.div>
            </div>

            {/* Stats Card */}
            <motion.div
                className="flex flex-col justify-center items-start p-3 gap-3 w-full max-w-[361px] bg-linear-to-b from-transparent to-[rgba(27,245,176,0.12)] rounded-[24px] mt-4"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
                {/* Winnings Label + User */}
                <motion.div
                    className="flex flex-row justify-between items-center px-2 py-[7px] gap-2.5 w-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 }}
                >
                    <span className="font-display font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                        Winnings
                    </span>

                    <div className="flex flex-row items-center gap-2.5">
                        <motion.div
                            className="relative w-[18px] h-[18px] rounded-full overflow-hidden bg-[#D9D9D9] shrink-0"
                            whileHover={{ scale: 1.15 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Image
                                width={18}
                                height={18}
                                unoptimized
                                src={pfpUrl || "/images/avatars/a.png"}
                                alt={username}
                                className="object-cover w-full h-full"
                            />
                        </motion.div>
                        <span className="font-body text-[18px] leading-[100%] text-white uppercase truncate max-w-[120px]">
                            {username}
                        </span>
                    </div>
                </motion.div>

                {/* Big Money + Trophy */}
                <motion.div
                    className="flex flex-row justify-between items-center gap-3 w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.55 }}
                >
                    <motion.h2
                        className="font-body text-[40px] sm:text-[48px] leading-[90%] text-[#14B985]"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                    >
                        ${winnings.toLocaleString()}
                    </motion.h2>

                    <motion.div
                        className="relative w-[38px] h-[48px] shrink-0"
                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.65,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                        <Image
                            src="/images/trophies/gold.svg"
                            alt="Winner Trophy"
                            fill
                            className="object-contain"
                        />
                    </motion.div>
                </motion.div>

                {/* Score + Rank boxes */}
                <div className="flex flex-row items-start gap-3 w-full">
                    {/* Score Box */}
                    <motion.div
                        className="flex flex-col items-start p-3 gap-2 flex-1 min-w-0 bg-white/3 border border-white/8 rounded-[16px]"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.7 }}
                        whileHover={{
                            scale: 1.03,
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                        }}
                    >
                        <span className="font-display font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                            Score
                        </span>
                        <div className="flex flex-row items-center gap-1">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 10, -10, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 4,
                                    ease: "easeInOut",
                                }}
                            >
                                <FlashIcon className="w-6 h-6 text-[#FFC931] shrink-0" />
                            </motion.div>
                            <span className="font-body text-[20px] leading-[100%] text-white">
                                {score.toLocaleString()}
                            </span>
                        </div>
                    </motion.div>

                    {/* Rank Box */}
                    <motion.div
                        className="flex flex-col items-start p-3 gap-2 flex-1 min-w-0 bg-white/3 border border-white/8 rounded-[16px]"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                        whileHover={{
                            scale: 1.03,
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                        }}
                    >
                        <span className="font-display font-medium text-[14px] leading-[130%] tracking-[-0.03em] text-[#99A0AE]">
                            Rank
                        </span>
                        <div className="flex flex-row items-center gap-1">
                            <motion.div
                                animate={{
                                    y: [0, -3, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    ease: "easeInOut",
                                }}
                            >
                                <TrendIcon className="w-6 h-6 text-[#14B985] shrink-0" />
                            </motion.div>
                            <span className="font-body text-[20px] leading-[100%] text-white">
                                {rank}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Percentile + Buttons */}
            <div className="flex flex-col justify-center items-center gap-3 w-full max-w-[361px] mt-5">
                {/* Percentile row */}
                <motion.div
                    className="flex flex-row items-center gap-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "easeInOut",
                        }}
                    >
                        <FlashIcon className="w-4 h-4 text-[#FFC931]" />
                    </motion.div>
                    <span className="font-display font-medium text-[12px] leading-[14px] tracking-[-0.03em] text-white">
                        You finished faster than {percentile}% of your friends
                    </span>
                </motion.div>

                {/* SHARE SCORE button (primary action) */}
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <button onClick={handleShare} className="w-full">
                        <FancyBorderButton className="text-[#14B985] border-[#14B985]">
                            SHARE SCORE
                        </FancyBorderButton>
                    </button>
                </motion.div>

                {/* BACK TO HOME button (secondary) */}
                <motion.div
                    className="w-full"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                >
                    <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Link
                            href="/game"
                            className="flex flex-row justify-center items-center py-3 w-full rounded-[12px] no-underline hover:bg-white/5 transition-colors duration-200"
                        >
                            <span className="font-body font-normal text-[18px] leading-[115%] tracking-[-0.02em] text-[#00CFF2]">
                                BACK TO HOME
                            </span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Top 3 Leaderboard */}
            <motion.div
                className="flex flex-col items-start gap-2 w-full max-w-[361px] my-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
            >
                {/* Header row */}
                <motion.div
                    className="flex flex-row items-center py-[2px] gap-2 w-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1.0 }}
                >
                    <h2 className="font-body text-[22px] leading-[92%] tracking-[-0.03em] text-white whitespace-nowrap">
                        TOP 3 FINISHERS
                    </h2>
                    <div className="flex-1" />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link
                            href="/leaderboard"
                            className="px-3 py-2 rounded-[12px] hover:bg-[#00CFF2]/10"
                        >
                            <span className="font-body text-[18px] leading-[115%] tracking-[-0.02em] text-[#00CFF2]">
                                VIEW LEADERBOARD
                            </span>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Leaderboard entries */}
                {leaderboard.slice(0, 3).map((e, i) => (
                    <motion.div
                        key={e.username}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                            duration: 0.4,
                            delay: 1.1 + i * 0.15,
                            ease: [0.34, 1.56, 0.64, 1],
                        }}
                        whileHover={{ scale: 1.02 }}
                        className={`box-border flex flex-col items-start p-3 gap-3 w-full min-h-[60px] border border-white/8 rounded-[16px] ${THEMES[i]}`}
                    >
                        <div className="flex flex-row justify-between items-center gap-2 w-full">
                            {/* User section */}
                            <div className="flex flex-row items-center gap-2 min-w-0 flex-1">
                                {/* Trophy */}
                                <div className="relative w-[29px] h-[36px] shrink-0">
                                    <Image
                                        src={TROPHY_PATHS[i]}
                                        fill
                                        alt=""
                                        className="object-contain"
                                    />
                                </div>
                                {/* Avatar + Username */}
                                <div className="flex flex-row items-center gap-1 min-w-0">
                                    <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[#F0F3F4] shrink-0">
                                        <Image
                                            src={e.pfpUrl ?? "/images/avatar-default.png"}
                                            width={20}
                                            height={20}
                                            alt=""
                                            className="object-cover w-full h-full"
                                            unoptimized
                                        />
                                    </div>
                                    <span className="font-body text-[18px] leading-[130%] text-white truncate max-w-[150px]">
                                        {e.username}
                                    </span>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="flex flex-row items-center gap-1 shrink-0">
                                <FlashIcon className="w-6 h-6 text-[#FFC931]" />
                                <span className="font-body text-[20px] leading-[100%] text-white tabular-nums">
                                    {e.score.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
