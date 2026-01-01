"use client";

/**
 * QuestionView
 *
 * Displays a question with options during live game.
 * Uses Zustand store for answer state via useLiveGameState.
 */

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCardHeader } from "./QuestionCardHeader";
import { QuestionOption } from "./QuestionOption";
import { playSound } from "@/lib/sounds";
import { PlayerAvatarStack } from "../../../_components/PlayerAvatarStack";
import type { LiveGameQuestion } from "../page";

// ==========================================
// ANIMATION VARIANTS
// ==========================================

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

const questionTextVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

const mediaVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1] as const,
        },
    },
};

const optionContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.3,
        },
    },
};

const statusVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.3,
            type: "spring" as const,
            stiffness: 300,
            damping: 20,
        },
    },
};

// ==========================================
// PROPS
// ==========================================

interface QuestionViewProps {
    question: LiveGameQuestion;
    questionNumber: number;
    totalQuestions: number;
    seconds: number;
    onAnswer: (selectedIndex: number) => void;
    hasAnswered: boolean;
}

// ==========================================
// COMPONENT
// ==========================================

export default function QuestionView({
    question,
    questionNumber,
    totalQuestions,
    seconds,
    onAnswer,
    hasAnswered,
}: QuestionViewProps) {
    const isLowTime = seconds <= 3 && seconds > 0;
    const isTimeUp = seconds === 0;

    const handleSelect = (index: number) => {
        if (hasAnswered) return;
        onAnswer(index);
        playSound("answerSubmit");
    };

    return (
        <motion.div
            className="w-full max-w-lg mx-auto mt-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={question.id}
        >
            {/* Header with timer */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <QuestionCardHeader
                    questionNumber={questionNumber}
                    totalQuestions={totalQuestions}
                    remaining={seconds}
                    duration={question.durationSec}
                />
            </motion.div>

            <section className="mx-auto w-full max-w-lg px-4" aria-live="polite">
                {/* Question Content with urgency glow */}
                <motion.div
                    className="relative mx-auto mb-4 flex items-center justify-center w-full max-w-[306px] font-body font-normal text-[36px] leading-[0.92] text-center tracking-[-0.03em] text-white"
                    variants={questionTextVariants}
                    animate={
                        isLowTime
                            ? {
                                textShadow: [
                                    "0 0 0px rgba(255,107,107,0)",
                                    "0 0 20px rgba(255,107,107,0.6)",
                                    "0 0 0px rgba(255,107,107,0)",
                                ],
                            }
                            : {}
                    }
                    transition={isLowTime ? { duration: 0.8, repeat: Infinity } : undefined}
                >
                    {question.content}
                </motion.div>

                {/* Media with spring entrance */}
                <AnimatePresence>
                    {question.mediaUrl && (
                        <motion.figure
                            className="mx-auto mb-4 flex justify-center w-full"
                            variants={mediaVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        >
                            <div className="relative w-full aspect-video rounded-[10px] overflow-hidden bg-[#17171a] border border-[#313136] shadow-[0_8px_0_#000]">
                                <Image
                                    src={question.mediaUrl}
                                    alt={question.content}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 100vw, 500px"
                                    priority
                                    loading="eager"
                                    quality={80}
                                    placeholder="blur"
                                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                                />
                            </div>
                        </motion.figure>
                    )}
                </AnimatePresence>

                {/* Options with staggered entrance */}
                <motion.ul
                    className="mx-auto mb-2 flex w-full flex-col gap-2"
                    variants={optionContainerVariants}
                >
                    {question.options.map((opt, idx) => (
                        <QuestionOption
                            key={idx}
                            option={opt}
                            index={idx}
                            selectedOptionIndex={hasAnswered ? -1 : null}
                            onSelect={handleSelect}
                            disabled={hasAnswered || isTimeUp}
                        />
                    ))}
                </motion.ul>

                {/* Answered status with bounce entrance */}
                <AnimatePresence>
                    {hasAnswered && (
                        <motion.div
                            className="mx-auto text-center font-display text-[16px] text-[#99A0AE] flex items-center justify-center gap-2"
                            variants={statusVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    delay: 0.1,
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 15,
                                }}
                                className="text-green-400"
                            >
                                ✓
                            </motion.span>
                            Answer submitted! Wait for the next question...
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Real-time player count at bottom */}
                <AnimatePresence>
                    {hasAnswered && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="mt-auto pt-4"
                        >
                            <PlayerAvatarStack actionText="just answered" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>
        </motion.div>
    );
}
