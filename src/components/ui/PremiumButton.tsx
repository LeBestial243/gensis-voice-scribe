
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { theme } from "@/lib/theme";

const premiumButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Boutons premium avec effets
        primary: `relative overflow-hidden bg-gradient-to-r from-[${theme.colors.primary.gradient.from}] to-[${theme.colors.primary.gradient.to}] text-white shadow-[0_4px_20px_rgba(86,204,242,0.3)] hover:shadow-[0_8px_30px_rgba(86,204,242,0.5)] hover:scale-[1.02] active:scale-[0.98]`,
        
        glassmorphic: `relative overflow-hidden bg-[${theme.colors.glassmorphism.background}] backdrop-blur-[${theme.effects.blur.md}] border border-[${theme.colors.glassmorphism.border}] text-gray-800 shadow-lg hover:shadow-xl hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]`,
        
        outline: `relative overflow-hidden border-2 border-[${theme.colors.primary.gradient.to}]/30 text-[${theme.colors.primary.gradient.to}] hover:text-white bg-transparent hover:bg-gradient-to-r hover:from-[${theme.colors.primary.gradient.from}] hover:to-[${theme.colors.primary.gradient.to}] hover:border-transparent shadow-sm hover:shadow-[0_4px_20px_rgba(86,204,242,0.3)] active:scale-[0.98]`,
        
        ghost: `relative overflow-hidden text-[${theme.colors.primary.gradient.to}] hover:bg-gradient-to-r hover:from-[${theme.colors.primary.gradient.from}]/10 hover:to-[${theme.colors.primary.gradient.to}]/10 hover:text-[${theme.colors.primary.gradient.to}]/90 active:scale-[0.98]`,
        
        soft: `relative overflow-hidden bg-[${theme.colors.primary.gradient.from}]/10 text-[${theme.colors.primary.gradient.to}] hover:bg-[${theme.colors.primary.gradient.from}]/20 active:scale-[0.98]`,
        
        // Bouton avec un effet de pulse
        pulse: `relative overflow-hidden bg-gradient-to-r from-[${theme.colors.primary.gradient.from}] to-[${theme.colors.primary.gradient.to}] text-white shadow-[0_4px_20px_rgba(86,204,242,0.3)] hover:shadow-[0_8px_30px_rgba(86,204,242,0.5)] animate-pulse-subtle hover:animate-none hover:scale-[1.02] active:scale-[0.98]`,
        
        // Bouton avec un effet de bordure animée
        animated: `relative text-white shadow-sm after:absolute after:inset-0 after:rounded-xl after:content-[''] after:border-2 after:border-transparent after:bg-origin-border after:bg-gradient-to-r after:from-[${theme.colors.primary.gradient.from}] after:to-[${theme.colors.primary.gradient.to}] after:animate-border-pulse active:scale-[0.98]`,
        
        // Bouton destructif
        destructive: `bg-[${theme.colors.ui.destructive.DEFAULT}]/90 text-[${theme.colors.ui.destructive.foreground}] shadow-md hover:bg-[${theme.colors.ui.destructive.DEFAULT}] hover:shadow-lg active:scale-[0.98]`,
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10 rounded-full"
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, asChild = false, leftIcon, rightIcon, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </Comp>
    );
  }
);
PremiumButton.displayName = "PremiumButton";

export { PremiumButton, premiumButtonVariants };
