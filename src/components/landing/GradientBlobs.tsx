"use client";

import { motion } from "framer-motion";

/**
 * GradientBlobs - Animated gradient mesh background
 * Creates organic, flowing color blobs for premium feel
 */
export function GradientBlobs({
    colors = ["#FFC931", "#FF6B6B", "#4ECDC4", "#45B7D1"],
    className = "",
}: {
    colors?: string[];
    className?: string;
}) {
    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`}>
            {/* Apply blur and contrast for gooey effect */}
            <div className="absolute inset-0" style={{ filter: "blur(60px)" }}>
                {colors.map((color, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full opacity-60"
                        style={{
                            background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                            width: `${300 + i * 50}px`,
                            height: `${300 + i * 50}px`,
                        }}
                        animate={{
                            x: [
                                `${20 + i * 15}%`,
                                `${50 - i * 10}%`,
                                `${30 + i * 20}%`,
                                `${20 + i * 15}%`,
                            ],
                            y: [
                                `${20 + i * 10}%`,
                                `${40 - i * 5}%`,
                                `${60 - i * 15}%`,
                                `${20 + i * 10}%`,
                            ],
                            scale: [1, 1.2, 0.9, 1],
                        }}
                        transition={{
                            duration: 15 + i * 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Subtle animated noise/grain overlay for texture
 */
export function AnimatedNoise({ opacity = 0.03 }: { opacity?: number }) {
    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-[9995]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                opacity,
            }}
            animate={{
                x: [0, -10, 5, -5, 0],
                y: [0, 5, -10, 5, 0],
            }}
            transition={{
                duration: 0.15,
                repeat: Infinity,
                repeatType: "loop",
            }}
        />
    );
}

/**
 * Landing page grain texture overlay
 * Matches Figma specs: Monotone noise, Size 0.5, Density 49%, #000000
 * Applied to section backgrounds only (not on content/text)
 */
export function LandingNoise({ className = "" }: { className?: string }) {
    return (
        <div
            className={`absolute inset-0 pointer-events-none z-0 ${className}`}
            style={{
                backgroundImage: `url("/noise.svg")`,
                backgroundRepeat: "repeat",
                opacity: 0.49, // Figma: Density 49%
            }}
            aria-hidden="true"
        />
    );
}

/**
 * Floating ambient particles
 */
export function FloatingParticles({
    count = 20,
    color = "#FFC931",
    className = "",
}: {
    count?: number;
    color?: string;
    className?: string;
}) {
    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {[...Array(count)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        width: Math.random() * 4 + 2,
                        height: Math.random() * 4 + 2,
                        background: color,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.5 + 0.2,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        x: [0, Math.random() * 20 - 10, 0],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}
