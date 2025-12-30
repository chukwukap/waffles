import Image from "next/image";

const splashImages = [
  "/images/splash/1.png",
  "/images/splash/2.png",
  "/images/splash/3.png",
  "/images/splash/4.png",
  "/images/splash/5.png",
  "/images/splash/6.png",
  "/images/splash/8.png",
  "/images/splash/9.png",
  "/images/splash/10.png",
  "/images/splash/11.png",
  "/images/splash/dude.png",
  "/images/splash/joker.png",
];

export function WaitlistFooter() {
  return (
    <footer className="shrink-0 overflow-hidden">
      <div className="flex flex-row items-end justify-center -space-x-14">
        {splashImages.map((src, index) => (
          <div key={src} className="relative">
            <Image
              priority
              src={src}
              alt={`Waffles crew member ${index + 1}`}
              width={68}
              height={88}
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
          </div>
        ))}
      </div>
    </footer>
  );
}
