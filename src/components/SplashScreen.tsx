"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
    duration?: number;
    onComplete?: () => void;
}

// Figma design is 393px wide. Convert to percentage of viewport width
const toPercentX = (px: number) => `${(px / 393) * 100}%`;
// Convert pixel size to vw for responsive sizing (393px = 100vw on mobile)
const toVw = (px: number) => `${(px / 393) * 100}vw`;

export function SplashScreen({ duration = 2000, onComplete }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-9999 overflow-hidden app-background"
                >
                    {/* Center Logo Container */}
                    <div
                        className="absolute flex flex-col items-center"
                        style={{
                            width: "40vw",
                            maxWidth: "157px",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            gap: "5px",
                        }}
                    >
                        <Image
                            src="/logo.png"
                            alt="Waffles"
                            width={55}
                            height={43}
                            priority
                            className="w-[54] max-w-[55px] h-[42]"
                        />
                        <span
                            className="font-body text-white text-center"
                            style={{
                                fontSize: "clamp(18px, 6vw, 44px)",
                                letterSpacing: "0.05em",
                            }}
                        >
                            WAFFLES
                        </span>
                    </div>

                    {/* Character images - responsive with vw sizing */}

                    {/* 1.png */}
                    <Image
                        src="/images/splash/1.png"
                        alt=""
                        width={1000}
                        height={800}
                        className="absolute"
                        style={{
                            width: toVw(1000 * 1.25),
                            height: "auto",
                            left: toPercentX(-21),
                            bottom: "6vh",
                            transform: "rotate(6.78deg)",
                        }}
                    />

                    {/* 2.png */}
                    <Image
                        src="/images/splash/2.png"
                        alt=""
                        width={87}
                        height={95}
                        className="absolute"
                        style={{
                            width: toVw(87 * 1.25),
                            height: "auto",
                            zIndex: 1,
                            left: toPercentX(-9),
                            bottom: "0",
                        }}
                    />

                    {/* 3.png */}
                    <Image
                        src="/images/splash/3.png"
                        alt=""
                        width={90}
                        height={85}
                        className="absolute"
                        style={{
                            width: toVw(90 * 1.25),
                            height: "auto",
                            left: toPercentX(70),
                            bottom: "-3vh",
                        }}
                    />

                    {/* 4.png */}
                    <Image
                        src="/images/splash/4.png"
                        alt=""
                        width={130}
                        height={90}
                        className="absolute"
                        style={{
                            width: toVw(130 * 1.25),
                            height: "auto",
                            zIndex: 1,
                            left: toPercentX(110),
                            bottom: "0",
                        }}
                    />

                    {/* 5.png */}
                    <Image
                        src="/images/splash/5.png"
                        alt=""
                        width={75}
                        height={69}
                        className="absolute"
                        style={{
                            width: toVw(75 * 1.25),
                            height: "auto",
                            left: toPercentX(200),
                            bottom: "-2vh",
                            transform: "scaleX(-1)",
                        }}
                    />

                    {/* 6.png */}
                    <Image
                        src="/images/splash/6.png"
                        alt=""
                        width={90}
                        height={70}
                        className="absolute"
                        style={{
                            width: toVw(90 * 1.25),
                            height: "auto",
                            zIndex: 1,
                            left: toPercentX(150),
                            bottom: "0",
                        }}
                    />

                    {/* 7.png (dude) */}
                    <Image
                        src="/images/splash/dude.png"
                        alt=""
                        width={88}
                        height={88}
                        className="absolute"
                        style={{
                            width: toVw(88 * 1.25),
                            height: "auto",
                            left: toPercentX(263),
                            bottom: "0",
                        }}
                    />

                    {/* 8.png */}
                    <Image
                        src="/images/splash/8.png"
                        alt=""
                        width={100}
                        height={81}
                        className="absolute"
                        style={{
                            width: toVw(100 * 1.25),
                            height: "auto",
                            zIndex: 1,
                            left: toPercentX(226),
                            bottom: "0",
                        }}
                    />

                    {/* 9.png - jumping character */}
                    <Image
                        src="/images/splash/9.png"
                        alt=""
                        width={78}
                        height={83}
                        className="absolute"
                        style={{
                            width: toVw(78 * 1.25),
                            height: "auto",
                            zIndex: 2,
                            left: toPercentX(315),
                            bottom: "0",
                        }}
                    />

                    {/* 10.png */}
                    <Image
                        src="/images/splash/10.png"
                        alt=""
                        width={82}
                        height={74}
                        className="absolute"
                        style={{
                            width: toVw(82 * 1.25),
                            height: "auto",
                            left: toPercentX(326),
                            bottom: "0",
                        }}
                    />

                    {/* 11.png - rotated */}
                    <Image
                        src="/images/splash/11.png"
                        alt=""
                        width={120}
                        height={100}
                        className="absolute"
                        style={{
                            width: toVw(120 * 1.25),
                            height: "auto",
                            zIndex: 1,
                            left: toPercentX(300),
                            bottom: "5vh",
                            transform: "rotate(-16.47deg)",
                        }}
                    />

                    {/* 12.png (joker) */}
                    <Image
                        src="/images/splash/joker.png"
                        alt=""
                        width={200}
                        height={120}
                        className="absolute"
                        style={{
                            width: toVw(200 * 1.25),
                            height: "auto",
                            right: toPercentX(-100),
                            bottom: "12vh",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
