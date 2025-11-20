"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
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

export function SplashScreen() {
  return (
    <div
      className={cn(
        "inset-0 z-80 flex items-center justify-center text-white h-dvh flex-col overflow-hidden fixed bg-[#191919]"
      )}
    >
      <div className="flex-1 overflow-y-auto space-y-1 px-3 flex items-center justify-center flex-col">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-24 w-40 drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] flex items-center justify-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-full h-full flex items-center justify-center"
          >
            <Image
              src="/logo.png"
              alt="Waffles Logo"
              width={160}
              height={96}
              className="object-contain w-40 h-24"
              priority
            />
          </motion.div>
        </motion.div>

        <div className="relative">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-body text-4xl tracking-tight relative z-10"
          >
            WAFFLES
          </motion.p>
          {/* Shimmer effect overlay */}
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "linear",
              repeatDelay: 0.5,
            }}
          />
        </div>
      </div>

      <footer className="shrink-0">
        <div className="flex flex-row items-stretch -space-x-16">
          {splashImages.map((src, index) => (
            <motion.div
              key={src}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.5 + index * 0.1,
                type: "spring",
                stiffness: 100,
                damping: 15
              }}
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              >
                <Image
                  priority
                  src={src}
                  alt={`Splash character ${index + 1}`}
                  width={68}
                  height={88}
                  className="h-20 w-auto object-contain"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </footer>
    </div>
  );
}
