import React from "react";
import { cn } from "@/lib/utils";

export interface InviteInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const InviteInput = React.forwardRef<HTMLInputElement, InviteInputProps>(
  ({ className, type, value, ...props }, ref) => {
    const hasValue = value && value.length > 0;

    return (
      <div
        className={cn(
          "flex h-[56px] w-full max-w-[361px] items-center justify-center",
          "rounded-xl bg-white/10 py-[19px] px-4",
          "transition-all duration-200",
          "focus-within:ring-2 focus-within:ring-white/50",
          className
        )}
      >
        <input
          type={type}
          ref={ref}
          value={value}
          {...props}
          className={cn(
            "h-full w-full border-none bg-transparent p-0 text-center outline-none",
            "font-body leading-[1.3] tracking-[-0.03em] text-white",
            "placeholder:font-body placeholder:leading-[1.3] placeholder:tracking-[-0.03em] placeholder:text-center placeholder:text-white/40",
            "transition-all duration-150",
            // Dynamic font size based on whether there's a value
            hasValue ? "text-[33px]" : "text-[25px]"
          )}
        />
      </div>
    );
  }
);
InviteInput.displayName = "InviteInput";

export { InviteInput };
