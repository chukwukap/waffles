"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const crewImages = [
  "/images/splash/crew-1.png",
  "/images/splash/crew-2.png",
  "/images/splash/crew-3.png",
  "/images/splash/crew-4.png",
  "/images/splash/crew-5.png",
  "/images/splash/crew-6.png",
  "/images/splash/crew-7.png",
  "/images/splash/crew-8.png",
];

export function SplashScreen() {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[999] flex items-center justify-center text-white",
        "bg-gradient-to-b from-[#1E1E1E] to-black"
      )}
    >
      <div className="relative flex h-full w-full max-w-sm flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 text-center mb-20">
          <div className="relative h-24 w-24 drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <Image src="/logo.png" alt="Waffles Logo" fill priority />
          </div>
          <p className="font-body text-4xl tracking-tight">WAFFLES</p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-32 items-end justify-center gap-2 px-3 pb-4">
          {crewImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt=""
              width={90}
              height={90}
              className={cn(
                "h-[clamp(70px,10vw,90px)] w-auto opacity-95 drop-shadow-[0_12px_25px_rgba(0,0,0,0.45)]",
                index % 2 === 0 ? "-rotate-2" : "rotate-2"
              )}
              priority
            />
          ))}
        </div>
      </div>
    </div>
  );
}
