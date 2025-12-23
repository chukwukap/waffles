"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
    duration?: number;
    onComplete?: () => void;
}

// Figma design is 393x852. Convert absolute px to % for responsive
const toPercent = (px: number, base: number) => `${(px / base) * 100}%`;
const BASE_W = 393;
const BASE_H = 852;

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
                    {/* Center Logo Container - Frame 1 from Figma */}
                    <div
                        className="absolute flex flex-col items-center"
                        style={{
                            width: "157px",
                            height: "82px",
                            left: "calc(50% - 157px/2)",
                            top: "calc(50% - 82px/2)",
                            gap: "12px",
                        }}
                    >
                        {/* Logo Icon - 55x43 */}
                        <Image
                            src="/logo.png"
                            alt="Waffles"
                            width={55}
                            height={43}
                            priority
                        />
                        {/* WAFFLES Text */}
                        <span
                            className="font-body text-white text-center"
                            style={{
                                width: "157px",
                                height: "28px",
                                fontSize: "24px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            WAFFLES
                        </span>
                    </div>

                    {/* ============================================
              Character images - positions from Figma
              Base: 393x852, positions converted to %
              ============================================ */}

                    {/* tg_image_654184121 - crew-8: left: -21px, top: 710px, rotated 6.78deg */}
                    <Image
                        src="/images/splash/crew-8.png"
                        alt=""
                        width={109}
                        height={100}
                        className="absolute"
                        style={{
                            left: toPercent(-21, BASE_W),
                            top: toPercent(710, BASE_H),
                            transform: "rotate(6.78deg)",
                        }}
                    />

                    {/* tg_image_1051967527 - crew-1: left: 34px, top: 778px */}
                    <Image
                        src="/images/splash/crew-1.png"
                        alt=""
                        width={87}
                        height={95}
                        className="absolute"
                        style={{
                            left: toPercent(34, BASE_W),
                            top: toPercent(778, BASE_H),
                        }}
                    />

                    {/* IMAGE 2025-10-15 9:24:37 PM - crew-2: left: 85px, top: 777px */}
                    <Image
                        src="/images/splash/crew-2.png"
                        alt=""
                        width={81}
                        height={78}
                        className="absolute"
                        style={{
                            left: toPercent(85, BASE_W),
                            top: toPercent(777, BASE_H),
                        }}
                    />

                    {/* tg_image_4053279077 - crew-3: left: 142px, top: 775px, flipped */}
                    <Image
                        src="/images/splash/crew-3.png"
                        alt=""
                        width={72}
                        height={91}
                        className="absolute"
                        style={{
                            left: toPercent(142, BASE_W),
                            top: toPercent(775, BASE_H),
                            transform: "scaleX(-1)",
                        }}
                    />

                    {/* tg_image_265292761 - crew-4: left: 178px, top: 783px */}
                    <Image
                        src="/images/splash/crew-4.png"
                        alt=""
                        width={85}
                        height={69}
                        className="absolute"
                        style={{
                            left: toPercent(178, BASE_W),
                            top: toPercent(783, BASE_H),
                        }}
                    />

                    {/* tg_image_3737816328 - crew-5: left: 235px, top: 775px */}
                    <Image
                        src="/images/splash/crew-5.png"
                        alt=""
                        width={62}
                        height={76}
                        className="absolute"
                        style={{
                            left: toPercent(235, BASE_W),
                            top: toPercent(775, BASE_H),
                        }}
                    />

                    {/* IMAGE 2025-10-15 9:25:04 PM - crew-6: left: 263px, top: 765px */}
                    <Image
                        src="/images/splash/crew-6.png"
                        alt=""
                        width={88}
                        height={88}
                        className="absolute"
                        style={{
                            left: toPercent(263, BASE_W),
                            top: toPercent(765, BASE_H),
                        }}
                    />

                    {/* tg_image_1655173376 - crew-9: left: 296px, top: 733px */}
                    <Image
                        src="/images/splash/crew-9.png"
                        alt=""
                        width={85}
                        height={81}
                        className="absolute"
                        style={{
                            left: toPercent(296, BASE_W),
                            top: toPercent(733, BASE_H),
                        }}
                    />

                    {/* tg_image_2450170503 - positioned higher: left: 315px, top: 672px */}
                    <Image
                        src="/images/splash/12.png"
                        alt=""
                        width={78}
                        height={83}
                        className="absolute"
                        style={{
                            left: toPercent(315, BASE_W),
                            top: toPercent(672, BASE_H),
                        }}
                    />

                    {/* IMAGE 2025-10-15 9:24:49 PM - crew-7: left: 326px, top: 779px */}
                    <Image
                        src="/images/splash/crew-7.png"
                        alt=""
                        width={82}
                        height={74}
                        className="absolute"
                        style={{
                            left: toPercent(326, BASE_W),
                            top: toPercent(779, BASE_H),
                        }}
                    />

                    {/* tg_image_254724669 - rotated: left: 337.61px, top: 742.02px, rotate -16.47deg */}
                    <Image
                        src="/images/splash/13.png"
                        alt=""
                        width={56}
                        height={72}
                        className="absolute"
                        style={{
                            left: toPercent(337.61, BASE_W),
                            top: toPercent(742.02, BASE_H),
                            transform: "rotate(-16.47deg)",
                        }}
                    />

                    {/* tg_image_2743669260 - bottom left: left: -9px, bottom: 0 */}
                    <Image
                        src="/images/splash/crew-10.png"
                        alt=""
                        width={68}
                        height={82}
                        className="absolute"
                        style={{
                            left: toPercent(-9, BASE_W),
                            bottom: "0",
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
