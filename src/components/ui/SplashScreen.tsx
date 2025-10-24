"use client";

import Image from "next/image";

const leftMemes = [
  { src: "/images/splash/meme-left-1.png", className: "w-24 rotate-3" },
  { src: "/images/splash/meme-left-2.png", className: "w-28 -rotate-6 left-12" },
  { src: "/images/splash/meme-left-3.png", className: "w-20 rotate-12 left-6" },
];

const rightMemes = [
  { src: "/images/splash/meme-right-1.png", className: "w-20 -rotate-3" },
  { src: "/images/splash/meme-right-2.png", className: "w-24 rotate-8 right-10" },
  { src: "/images/splash/meme-right-3.png", className: "w-28 -rotate-12 right-0" },
];

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[999] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(0,0,0,0.9))] text-white">
      <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10" />
      <header className="flex items-center justify-between px-6 pt-6 text-sm">
        <span className="font-sans text-base tracking-[0.1em]">9:41</span>
        <div className="flex items-center gap-2 text-white">
          <span className="h-3 w-5 rounded bg-white/80" />
          <span className="h-3 w-3 rounded-full bg-white/80" />
          <span className="h-3 w-5 rounded bg-white/80" />
        </div>
      </header>

      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative h-24 w-24">
            <Image src="/logo-icon.png" alt="Waffles Logo" fill priority />
          </div>
          <p className="font-edit-undo text-4xl tracking-[0.2em]">WAFFLES</p>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-4 pb-6">
          <div className="flex flex-col gap-3">
            {leftMemes.map((image, index) => (
              <Image
                key={`left-${index}`}
                src={image.src}
                alt=""
                width={120}
                height={120}
                className={`drop-shadow-2xl opacity-90 ${image.className}`}
                priority
              />
            ))}
          </div>
          <div className="flex flex-col items-end gap-3">
            {rightMemes.map((image, index) => (
              <Image
                key={`right-${index}`}
                src={image.src}
                alt=""
                width={120}
                height={120}
                className={`drop-shadow-2xl opacity-90 ${image.className}`}
                priority
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
