"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const splashImages = [
  "/images/splash/crew-4.png",
  "/images/splash/crew-1.png",
  "/images/splash/crew-8.png",
  "/images/splash/crew-2.png",
  "/images/splash/crew-3.png",
  "/images/splash/crew-6.png",
  "/images/splash/crew-5.png",
  "/images/splash/crew-7.png",
  "/images/splash/crew-9.png",
  "/images/splash/crew-10.png",
];

// Container animation - orchestrates the stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.8,
    },
  },
};

// Each character bounces in from below
const characterVariants = {
  hidden: { 
    opacity: 0, 
    y: 40,
    scale: 0.8,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: i * 0.05,
    },
  }),
};

export function WaitlistFooter() {
  return (
    <motion.footer 
      className="shrink-0 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-row items-end justify-center -space-x-14">
        {splashImages.map((src, index) => (
          <motion.div
            key={src}
            custom={index}
            variants={characterVariants}
            className="relative"
            whileTap={{ scale: 0.9, rotate: index % 2 === 0 ? -5 : 5 }}
          >
            {/* Subtle bounce animation on each character */}
            <motion.div
              animate={{ 
                y: [0, -3, 0],
              }}
              transition={{ 
                duration: 2 + (index % 3) * 0.5,
                repeat: Infinity, 
                ease: "easeInOut",
                delay: index * 0.15,
              }}
            >
              <Image
                priority
                src={src}
                alt={`Waffles crew member ${index + 1}`}
                width={68}
                height={88}
                className="h-20 w-auto object-contain drop-shadow-lg"
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.footer>
  );
}
