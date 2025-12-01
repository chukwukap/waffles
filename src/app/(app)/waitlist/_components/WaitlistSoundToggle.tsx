"use client";

import { SoundOffIcon, SoundOnIcon } from "@/components/icons";
import { useSound } from "@/components/providers/SoundContext";
import { motion } from "framer-motion";

export function WaitlistSoundToggle() {
    const { isSoundEnabled, toggleSound, playSound } = useSound();

    const handleClick = () => {
        playSound("click");
        toggleSound();
    };

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className="fixed top-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-lg text-white hover:bg-black/30 transition-colors"
            aria-label={isSoundEnabled ? "Mute sound" : "Unmute sound"}
        >
            {isSoundEnabled ? (
                <SoundOnIcon className="w-5 h-5" />
            ) : (
                <SoundOffIcon className="w-5 h-5" />
            )}
        </motion.button>
    );
}
