"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
    duration?: number; // Duration in ms before hiding
    onComplete?: () => void;
}

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
                    className="fixed inset-0 z-9999 flex flex-col items-center justify-center overflow-hidden"
                    style={{
                        background: "linear-gradient(180deg, #1E1E1E 0%, #000000 100%)",
                    }}
                >
                    {/* Center Logo */}
                    <div className="flex flex-col items-center">
                        <Image
                            src="/logo-onboarding.png"
                            alt="WAFFLES"
                            width={180}
                            height={90}
                            priority
                        />
                    </div>

                    {/* Character Row at Bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-[100px] overflow-hidden">
                        <div className="relative w-full h-full flex items-end justify-center">
                            {/* Position characters across the bottom */}
                            <Image
                                src="/images/splash/crew-1.png"
                                alt=""
                                width={87}
                                height={95}
                                className="absolute bottom-0 left-[5%]"
                                style={{ objectFit: "contain" }}
                            />
                            <Image
                                src="/images/splash/crew-2.png"
                                alt=""
                                width={81}
                                height={78}
                                className="absolute bottom-0 left-[18%]"
                                style={{ objectFit: "contain" }}
                            />
                            <Image
                                src="/images/splash/crew-3.png"
                                alt=""
                                width={72}
                                height={91}
                                className="absolute bottom-0 left-[30%] scale-x-[-1]"
                                style={{ objectFit: "contain" }}
                            />
                            <Image
                                src="/images/splash/crew-4.png"
                                alt=""
                                width={85}
                                height={69}
                                className="absolute bottom-0 left-[42%]"
                                style={{ objectFit: "contain" }}
                            />
                            <Image
                                src="/images/splash/crew-5.png"
                                alt=""
                                width={62}
                                height={76}
                                className="absolute bottom-0 left-[54%]"
                                style={{ objectFit: "contain" }}
                            />
                            <Image
                                src="/images/splash/crew-6.png"
                                alt=""
                                width={88}
                                height={88}
                                className="absolute bottom-0 left-[66%]"
                                style={{ objectFit: "contain" }}
                            />
                            <Image
                                src="/images/splash/crew-7.png"
                                alt=""
                                width={82}
                                height={74}
                                className="absolute bottom-0 right-[5%]"
                                style={{ objectFit: "contain" }}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
