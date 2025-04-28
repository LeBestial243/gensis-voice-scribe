
import { ButtonProps, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const GradientButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-white text-gensys-primary-to border border-gensys-primary-to/30",
          "shadow-md hover:shadow-[0_4px_20px_rgba(139,92,246,0.3)]",
          "transition-all duration-300 ease-out",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-gensys-primary-from before:to-gensys-primary-to",
          "before:origin-left before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300",
          "hover:text-white hover:border-transparent",
          "relative z-0 before:z-[-1]",
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </Button>
    );
  }
);
GradientButton.displayName = "GradientButton";
