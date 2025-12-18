"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useAnimation } from "motion/react";
import { FancyBorderButton } from "@/components/buttons/FancyBorderButton";
import { BuyTicketModal } from "./BuyTicketModal";
import {
    springs,
    staggerContainer,
    fadeInUp,
    scaleIn,
    popIn,
} from "@/lib/animations";

interface NextGameCardProps {
    gameId: number;
    theme: string;
    themeIcon?: string;
    tierPrices: number[];
    countdown: number;
    hasTicket: boolean;
    isLive: boolean;
    hasEnded: boolean;
    prizePool?: number;
    spotsTotal?: number;
    spotsTaken?: number;
    recentPlayers?: { avatar?: string; name: string }[];
    onPurchaseSuccess?: () => void;
}

// ==========================================
// ANIMATED NUMBER COMPONENT
// ==========================================

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValue = useRef(value);

    useEffect(() => {
        if (prevValue.current !== value) {
            // Animate from previous to new value
            const diff = value - prevValue.current;
            const steps = 20;
            const stepValue = diff / steps;
            let current = prevValue.current;
            let step = 0;

            const interval = setInterval(() => {
                step++;
                current += stepValue;
                setDisplayValue(Math.round(current));

                if (step >= steps) {
                    clearInterval(interval);
                    setDisplayValue(value);
                }
            }, 20);

            prevValue.current = value;
            return () => clearInterval(interval);
        }
    }, [value]);

    return (
        <motion.span
            key={value}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
        >
            {prefix}{displayValue.toLocaleString()}{suffix}
        </motion.span>
    );
}

// ==========================================
// COUNTDOWN DIGIT COMPONENT
// ==========================================

function CountdownDigit({ value, label }: { value: string; label: string }) {
    return (
        <motion.div
            key={value}
            initial={{ y: -10, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.8 }}
            transition={springs.snappy}
            className="inline-flex items-baseline"
        >
            <span className="font-body tabular-nums">{value}</span>
            <span className="font-body opacity-80 ml-0.5">{label}</span>
        </motion.div>
    );
}

// ==========================================
// DOTTED PATTERN BACKGROUND
// ==========================================

function DottedPattern() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
                backgroundImage: `radial-gradient(circle, #18181B 1.5px, transparent 1.5px)`,
                backgroundSize: "7px 7px",
            }}
        />
    );
}

// ==========================================
// FLOATING ANIMATION WRAPPER
// ==========================================

function FloatingElement({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            animate={{
                y: [0, -4, 0],
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}
        >
            {children}
        </motion.div>
    );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function NextGameCard({
    gameId,
    theme,
    themeIcon,
    tierPrices,
    countdown,
    hasTicket,
    isLive,
    hasEnded,
    prizePool = 0,
    spotsTotal = 100,
    spotsTaken = 0,
    recentPlayers = [],
    onPurchaseSuccess,
}: NextGameCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const buttonControls = useAnimation();

    // Mark as animated after initial render
    useEffect(() => {
        const timer = setTimeout(() => setHasAnimated(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    // Pulse button periodically when action is available
    useEffect(() => {
        if (hasAnimated && !hasTicket && !hasEnded) {
            const interval = setInterval(() => {
                buttonControls.start({
                    scale: [1, 1.02, 1],
                    transition: { duration: 0.4 },
                });
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [hasAnimated, hasTicket, hasEnded, buttonControls]);

    const hours = Math.floor(countdown / 3600);
    const minutes = Math.floor((countdown % 3600) / 60);
    const seconds = countdown % 60;
    const formatPart = (n: number) => String(n).padStart(2, "0");

    const getButtonConfig = () => {
        if (hasEnded) return { text: "ENDED", disabled: true, action: "none" as const };
        if (isLive) {
            return hasTicket
                ? { text: "START GAME", disabled: false, action: "navigate" as const, href: `/game/${gameId}/live` }
                : { text: "GET TICKET", disabled: false, action: "modal" as const };
        }
        return hasTicket
            ? { text: "YOU'RE IN!", disabled: true, action: "none" as const }
            : { text: "BUY WAFFLE", disabled: false, action: "modal" as const };
    };

    const buttonConfig = getButtonConfig();

    const handleButtonClick = () => {
        if (buttonConfig.disabled) return;
        if (buttonConfig.action === "modal") {
            setIsModalOpen(true);
        } else if (buttonConfig.action === "navigate" && "href" in buttonConfig) {
            window.location.href = buttonConfig.href;
        }
    };

    const othersCount = Math.max(0, spotsTaken - recentPlayers.length);

    return (
        <>
            {/* Card Container with entrance animation */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1], // Custom ease for smooth feel
                }}
                className="relative w-full max-w-[361px] mx-auto rounded-2xl overflow-hidden flex flex-col"
                style={{
                    background: "rgba(21, 21, 25, 0.5)",
                    boxShadow: "0px 5px 5.2px 8px rgba(12, 12, 14, 0.5)",
                }}
            >
                {/* Dotted Pattern Background */}
                <DottedPattern />

                {/* Header with slide-down animation */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, ...springs.gentle }}
                    className="relative flex justify-center items-center gap-2 shrink-0 z-10"
                    style={{
                        height: "clamp(40px, 6vh, 52px)",
                        background: "rgba(27, 27, 29, 0.8)",
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    >
                        <Image
                            src="/images/icons/game-controller.png"
                            alt="controller"
                            width={24}
                            height={24}
                            className="object-contain"
                            style={{ width: "clamp(20px, 3vh, 30px)", height: "auto" }}
                        />
                    </motion.div>
                    <span
                        className="font-body text-white uppercase"
                        style={{ fontSize: "clamp(18px, 3vh, 26px)", lineHeight: "92%", letterSpacing: "-0.03em" }}
                    >
                        NEXT GAME
                    </span>
                </motion.div>

                {/* Stats Row with staggered entrance */}
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="relative flex justify-around items-center z-10 shrink-0"
                    style={{ padding: "clamp(8px, 1.5vh, 16px) 0" }}
                >
                    {/* Spots */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col items-center"
                        style={{ gap: "clamp(2px, 0.5vh, 4px)" }}
                    >
                        <FloatingElement delay={0}>
                            <Image
                                src="/images/illustrations/spots.svg"
                                alt="spots"
                                width={48}
                                height={32}
                                className="object-contain"
                                style={{ width: "clamp(36px, 6vh, 48px)", height: "auto" }}
                            />
                        </FloatingElement>
                        <span
                            className="font-display text-white"
                            style={{ fontSize: "clamp(10px, 1.5vh, 12px)", opacity: 0.6 }}
                        >
                            Spots
                        </span>
                        <span
                            className="font-body text-white"
                            style={{ fontSize: "clamp(16px, 2.5vh, 24px)" }}
                        >
                            <AnimatedNumber value={spotsTaken} />/{spotsTotal}
                        </span>
                    </motion.div>

                    {/* Prize Pool */}
                    <motion.div
                        variants={fadeInUp}
                        className="flex flex-col items-center"
                        style={{ gap: "clamp(2px, 0.5vh, 4px)" }}
                    >
                        <FloatingElement delay={0.5}>
                            <Image
                                src="/images/illustrations/money-stack.svg"
                                alt="prize"
                                width={48}
                                height={32}
                                className="object-contain"
                                style={{ width: "clamp(36px, 6vh, 48px)", height: "auto" }}
                            />
                        </FloatingElement>
                        <span
                            className="font-display text-white"
                            style={{ fontSize: "clamp(10px, 1.5vh, 12px)", opacity: 0.6 }}
                        >
                            Prize pool
                        </span>
                        <span
                            className="font-body text-white"
                            style={{ fontSize: "clamp(16px, 2.5vh, 24px)" }}
                        >
                            <AnimatedNumber value={prizePool} prefix="$" />
                        </span>
                    </motion.div>
                </motion.div>

                {/* Button with scale animation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, ...springs.bouncy }}
                    className="relative flex justify-center items-center px-4 z-10 shrink-0"
                    style={{ padding: "clamp(6px, 1vh, 12px) 16px" }}
                >
                    <motion.div animate={buttonControls}>
                        <FancyBorderButton
                            disabled={buttonConfig.disabled}
                            onClick={handleButtonClick}
                        >
                            {buttonConfig.text}
                        </FancyBorderButton>
                    </motion.div>
                </motion.div>

                {/* Countdown with digit flip animations */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, ...springs.gentle }}
                    className="relative flex flex-col justify-center items-center z-10 shrink-0"
                    style={{ gap: "clamp(4px, 0.8vh, 8px)", padding: "clamp(6px, 1vh, 12px) 16px" }}
                >
                    <motion.div
                        animate={countdown <= 60 && countdown > 0 ? {
                            scale: [1, 1.05, 1],
                            borderColor: ["#F5BB1B", "#FF6B6B", "#F5BB1B"],
                        } : {}}
                        transition={{ duration: 1, repeat: countdown <= 60 ? Infinity : 0 }}
                        className="inline-flex items-center justify-center rounded-full gap-1"
                        style={{
                            border: "2px solid #F5BB1B",
                            padding: "clamp(6px, 1vh, 10px) clamp(14px, 2.5vh, 20px)",
                            height: "clamp(36px, 5vh, 44px)",
                        }}
                    >
                        <span
                            className="font-body flex gap-1"
                            style={{ fontSize: "clamp(16px, 2.5vh, 21px)", lineHeight: "115%", color: "#F5BB1B" }}
                        >
                            <AnimatePresence mode="popLayout">
                                <CountdownDigit key={`h-${hours}`} value={formatPart(hours)} label="H" />
                            </AnimatePresence>
                            <AnimatePresence mode="popLayout">
                                <CountdownDigit key={`m-${minutes}`} value={formatPart(minutes)} label="M" />
                            </AnimatePresence>
                            <AnimatePresence mode="popLayout">
                                <CountdownDigit key={`s-${seconds}`} value={formatPart(seconds)} label="S" />
                            </AnimatePresence>
                        </span>
                    </motion.div>
                    <p
                        className="font-display text-white"
                        style={{ fontSize: "clamp(10px, 1.5vh, 12px)", opacity: 0.5, letterSpacing: "-0.03em" }}
                    >
                        Until game starts
                    </p>
                </motion.div>

                {/* Live Indicator with enhanced pulse */}
                <AnimatePresence>
                    {isLive && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={springs.bouncy}
                            className="relative flex items-center justify-center gap-2 z-10 shrink-0 py-2 overflow-hidden"
                        >
                            <motion.div
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [1, 0.5, 1],
                                }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-3 h-3 rounded-full bg-red-500"
                            />
                            <motion.span
                                animate={{ opacity: [1, 0.7, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="font-body text-red-500 text-lg uppercase"
                            >
                                LIVE NOW
                            </motion.span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Player Avatars Row with staggered entrance */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="relative flex items-center justify-center z-10 shrink-0"
                    style={{ gap: "clamp(4px, 0.8vh, 6px)", padding: "clamp(8px, 1.5vh, 12px) 16px" }}
                >
                    {spotsTaken > 0 ? (
                        <>
                            {/* Stacked Avatars with staggered animation */}
                            <div className="flex items-center" style={{ marginRight: "6px" }}>
                                {recentPlayers.slice(0, 4).map((player, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20, scale: 0 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        transition={{
                                            delay: 0.7 + idx * 0.1,
                                            ...springs.bouncy,
                                        }}
                                        className="rounded-full overflow-hidden shrink-0"
                                        style={{
                                            width: "clamp(20px, 3vh, 25px)",
                                            height: "clamp(20px, 3vh, 25px)",
                                            border: "2px solid #FFFFFF",
                                            background: "#F0F3F4",
                                            marginLeft: idx === 0 ? "0" : "-10px",
                                            zIndex: 4 - idx,
                                        }}
                                    >
                                        {player.avatar && (
                                            <Image
                                                src={player.avatar}
                                                alt={player.name}
                                                width={25}
                                                height={25}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                            {/* "and X others" text */}
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                                className="font-display"
                                style={{ fontSize: "clamp(11px, 1.6vh, 14px)", lineHeight: "130%", color: "#99A0AE", letterSpacing: "-0.03em" }}
                            >
                                {othersCount > 0 ? `and ${othersCount} others have joined the game` : "have joined the game"}
                            </motion.span>
                        </>
                    ) : (
                        <motion.span
                            animate={{
                                opacity: [0.6, 1, 0.6],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="font-display"
                            style={{ fontSize: "clamp(11px, 1.6vh, 14px)", color: "#99A0AE" }}
                        >
                            Be the first to join!
                        </motion.span>
                    )}
                </motion.div>
            </motion.div>

            {/* Buy Ticket Modal */}
            <BuyTicketModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                gameId={gameId}
                theme={theme}
                themeIcon={themeIcon}
                tierPrices={tierPrices}
                prizePool={prizePool}
                onPurchaseSuccess={onPurchaseSuccess}
            />
        </>
    );
}
