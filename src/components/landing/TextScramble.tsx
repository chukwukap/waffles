"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface TextScrambleProps {
    text: string;
    className?: string;
    scrambleSpeed?: number; // ms between character reveals
    revealDelay?: number; // ms before starting reveal
    trigger?: "mount" | "inView" | "hover";
    scrambleChars?: string;
}

const DEFAULT_SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#________ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * TextScramble - Matrix-style text decode/scramble effect
 * Characters shuffle with random symbols before resolving to final text
 */
export function TextScramble({
    text,
    className = "",
    scrambleSpeed = 50,
    revealDelay = 0,
    trigger = "inView",
    scrambleChars = DEFAULT_SCRAMBLE_CHARS,
}: TextScrambleProps) {
    const [displayText, setDisplayText] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);
    const frameRef = useRef<number>(0);
    const resolvedCountRef = useRef(0);

    const getRandomChar = useCallback(() => {
        return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
    }, [scrambleChars]);

    const scramble = useCallback(() => {
        if (hasAnimated && trigger !== "hover") return;

        setIsAnimating(true);
        resolvedCountRef.current = 0;

        const chars = text.split("");
        const totalFrames = chars.length;
        let currentFrame = 0;

        const animate = () => {
            currentFrame++;

            const newText = chars.map((char, i) => {
                if (char === " ") return " ";
                if (i < resolvedCountRef.current) return char;
                return getRandomChar();
            }).join("");

            setDisplayText(newText);

            // Reveal one character per frame
            if (currentFrame % 2 === 0 && resolvedCountRef.current < chars.length) {
                resolvedCountRef.current++;
            }

            if (resolvedCountRef.current < chars.length) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayText(text);
                setIsAnimating(false);
                setHasAnimated(true);
            }
        };

        // Start with scrambled text after delay
        setTimeout(() => {
            frameRef.current = requestAnimationFrame(animate);
        }, revealDelay);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [text, getRandomChar, revealDelay, hasAnimated, trigger]);

    // Trigger on mount
    useEffect(() => {
        if (trigger === "mount") {
            scramble();
        }
    }, [trigger, scramble]);

    // Trigger on inView
    useEffect(() => {
        if (trigger !== "inView") return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        scramble();
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [trigger, scramble, hasAnimated]);

    // Handle hover trigger
    const handleMouseEnter = () => {
        if (trigger === "hover" && !isAnimating) {
            setHasAnimated(false);
            scramble();
        }
    };

    return (
        <motion.span
            ref={elementRef}
            className={className}
            onMouseEnter={handleMouseEnter}
            initial={{ opacity: trigger === "mount" ? 0 : 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {displayText || (trigger === "mount" ? "" : text)}
        </motion.span>
    );
}

/**
 * Splits text and applies scramble to each word with stagger
 */
export function TextScrambleWords({
    text,
    className = "",
    wordClassName = "",
    staggerDelay = 100,
    ...props
}: TextScrambleProps & { wordClassName?: string; staggerDelay?: number }) {
    const words = text.split(" ");

    return (
        <span className={className}>
            {words.map((word, i) => (
                <span key={i}>
                    <TextScramble
                        text={word}
                        className={wordClassName}
                        revealDelay={i * staggerDelay}
                        {...props}
                    />
                    {i < words.length - 1 && " "}
                </span>
            ))}
        </span>
    );
}
