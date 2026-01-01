"use client";

import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="app-background min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="text-center space-y-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-4"
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-display font-bold tracking-tight text-foreground"
          >
            Waffles
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
            className="h-1 w-20 mx-auto bg-linear-to-r from-waffle-gold via-neon-cyan to-waffle-gold rounded-full"
          />
        </motion.div>
      </div>

      {/* Subtle ambient glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5, delay: 0.3 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-radial from-waffle-gold/10 via-transparent to-transparent blur-3xl pointer-events-none"
      />
    </div>
  );
}
