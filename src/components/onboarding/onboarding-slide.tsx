import { cn } from "@/lib/utils";
import Image from "next/image";

interface OnboardingSlideProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export function OnboardingSlide({
  icon,
  title,
  description,
  className,
}: OnboardingSlideProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between text-center px-8 py-8",
        className
      )}
    >
      <div className="mb-8 animate-in-right relative w-48 h-48">
        <Image src={icon} alt={title} fill className="object-contain" />
      </div>
      <h2 className="text-3xl font-bold mb-4 text-balance animate-in-right uppercase tracking-wider">
        {title}
      </h2>
      <p className="text-lg text-center font-display text-muted max-w-md text-pretty animate-in-right">
        {description}
      </p>
    </div>
  );
}
