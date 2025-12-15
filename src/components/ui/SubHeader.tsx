"use client";

import { ArrowLeftIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SubHeaderProps {
  title: React.ReactNode;
  className?: string;
  backButtonClassName?: string;
}

export function SubHeader({
  title,
  className,
  backButtonClassName,
}: SubHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      className={cn(
        "mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3",
        className
      )}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* Animated back button */}
      <motion.button
        onClick={() => router.back()}
        className={cn(
          "flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white/15 transition-colors",
          backButtonClassName
        )}
        aria-label="Back"
        whileTap={{ scale: 0.9 }}
        whileHover={{ backgroundColor: "rgba(255,255,255,0.25)" }}
      >
        <motion.div
          initial={{ x: 5, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeftIcon />
        </motion.div>
      </motion.button>

      {/* Animated title */}
      <motion.div
        className="grow text-center text-white font-body flex justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, type: "spring", stiffness: 300 }}
      >
        {typeof title === "string" ? (
          <h1
            style={{
              fontWeight: 400,
              fontSize: "clamp(1.25rem, 4.5vw, 1.375rem)",
              lineHeight: ".92",
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </h1>
        ) : (
          title
        )}
      </motion.div>

      {/* Spacer for alignment */}
      <div className="h-[34px] w-[34px]" aria-hidden="true" />
    </motion.div>
  );
}
