import Image from "next/image";
import { cn } from "@/lib/utils";

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
        {/* Logo container with fade-in and scale animation */}
        <div className="relative h-24 w-40 drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] flex items-center justify-center animate-[fadeInScale_0.5s_ease-out]">
          {/* Floating logo animation */}
          <div className="w-full h-full flex items-center justify-center animate-[float_2s_ease-in-out_infinite]">
            <Image
              src="/logo.png"
              alt="Waffles Logo"
              width={160}
              height={96}
              className="object-contain w-40 h-24"
              priority
            />
          </div>
        </div>

        <div className="relative">
          {/* Text with fade-in from below animation */}
          <p className="font-body text-4xl tracking-tight relative z-10 animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
            WAFFLES
          </p>
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_2s_linear_infinite]" />
        </div>
      </div>

      <footer className="shrink-0">
        <div className="flex flex-row items-stretch -space-x-16">
          {splashImages.map((src, index) => (
            <div
              key={src}
              className="animate-[slideUp_0.6s_ease-out_both]"
              style={{
                animationDelay: `${0.5 + index * 0.1}s`,
              }}
            >
              <div
                className="animate-[floatSlow_2s_ease-in-out_infinite]"
                style={{
                  animationDelay: `${index * 0.2}s`,
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
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

