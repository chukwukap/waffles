"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface WaffleLoaderProps {
    className?: string;
    text?: string;
    size?: number;
}

export function WaffleLoader({
    className,
    text = "LOADING...",
    size = 120
}: WaffleLoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-6 min-h-[50vh] w-full", className)}>
            <motion.div
                animate={{
                    y: [0, -15, 0],
                    scale: [1, 1.05, 1],
                    rotate: [0, -5, 5, 0]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative"
                style={{ width: size, height: size }}
            >
                <Image
                    src="/images/illustrations/waffles.svg"
                    alt="Loading..."
                    fill
                    className="object-contain drop-shadow-xl"
                    priority
                />
            </motion.div>

            {text && (
                <motion.h2
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                    className="font-body font-normal text-[24px] text-white tracking-wider"
                >
                    {text}
                </motion.h2>
            )}
        </div>
    );
}
