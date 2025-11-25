import React from "react";
import { cn } from "@/lib/utils"; // Assuming you use a utility for class names

// Define the component's props, extending standard input attributes
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
  ({ className, type, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex h-[56px] w-[361px] max-w-full items-center justify-center",
          "rounded-xl  bg-[#FFFFFF1A] px-3 ", // Container styles
          "focus-within:border-white focus-within:ring-2 focus-within:ring-white/50", // Focus state
          className // Allow merging custom classes
        )}
      >
        <input
          type={type}
          ref={ref}
          {...props}
          className={cn(
            "h-full w-full border-none bg-transparent p-0 text-center outline-none",
            "text-[33px] font-body leading-[1.3] tracking-[-0.03em] text-white",
            "placeholder:text-[14px] placeholder:font-body placeholder:leading-[1.3] placeholder:tracking-[-0.03em] placeholder:text-center"
          )}
        />
      </div>
    );
  }
);
InviteInput.displayName = "InviteInput";

export { InviteInput };
