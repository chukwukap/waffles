
import Image from "next/image";

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


export function WaitlistFooter() {
    return (
        <footer className="shrink-0">
            <div className="flex flex-row items-stretch  -space-x-16">
                {splashImages.map((src, index) => (
                    <Image
                        priority
                        key={src}
                        src={src}
                        alt={`Splash character ${index + 1}`}
                        width={68}
                        height={88}
                        className="h-20 w-auto object-contain"
                    />
                ))}
            </div>
        </footer>
    );
}