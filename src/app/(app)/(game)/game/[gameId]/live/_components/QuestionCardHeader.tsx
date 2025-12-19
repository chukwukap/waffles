"use client";

import { motion, AnimatePresence } from "framer-motion";
import { formatTimeColon } from "@/lib/utils";
import { TimerTube } from "./TimerTube";

interface QuestionCardHeaderProps {
  questionNumber: number;
  totalQuestions: number;
  remaining: number;
  duration: number;
}

export function QuestionCardHeader({
  questionNumber,
  totalQuestions,
  remaining,
  duration,
}: QuestionCardHeaderProps) {
  const isLowTime = remaining <= 3 && remaining > 0;
  const isTimeUp = remaining === 0;

  return (
    <motion.div
      className="w-full flex items-center justify-between px-3 py-2"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Question Counter with subtle entrance */}
      <motion.span
        className="font-body text-white text-[18px] leading-none tracking-tight"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={questionNumber}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            {String(questionNumber).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
        /{String(totalQuestions).padStart(2, "0")}
      </motion.span>

      {/* Timer - countdown display with micro-interactions */}
      <motion.div
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {/* Animated timer text */}
        <motion.div
          className="relative overflow-hidden"
          animate={
            isLowTime
              ? {
                scale: [1, 1.1, 1],
              }
              : {}
          }
          transition={
            isLowTime ? { duration: 0.5, repeat: Infinity } : undefined
          }
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={remaining}
              className="font-body text-[18px] inline-block"
              style={{
                color: isTimeUp ? "#FF6B6B" : isLowTime ? "#FF6B6B" : "#ffffff",
              }}
              initial={{ opacity: 0, y: -12, scale: 1.2 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.8 }}
              transition={{
                duration: 0.25,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              {formatTimeColon(remaining)}
            </motion.span>
          </AnimatePresence>
        </motion.div>

        {/* Timer tube with warning state */}
        <motion.div
          animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
          transition={isLowTime ? { duration: 0.4, repeat: Infinity } : undefined}
        >
          <TimerTube remaining={remaining} duration={duration} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
