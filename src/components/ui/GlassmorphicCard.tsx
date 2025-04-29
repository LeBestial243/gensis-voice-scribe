
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { theme } from "@/lib/theme";

const cardVariants = cva(
  "relative overflow-hidden rounded-2xl border transition-all duration-300",
  {
    variants: {
      variant: {
        default: `bg-white/80 backdrop-blur-md border-white/20 shadow-lg`,
        premium: `bg-white/90 backdrop-blur-xl border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.09)]`,
        dark: `bg-black/70 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]`,
        gradient: `border-0 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-md shadow-lg`
      },
      hover: {
        default: "hover:shadow-xl hover:translate-y-[-2px]",
        glow: "hover:shadow-[0_10px_40px_rgba(86,204,242,0.2)] hover:border-primary/30",
        scale: "hover:scale-[1.02] hover:shadow-xl",
        highlight: "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/0 before:to-primary/0 before:opacity-0 hover:before:from-primary/10 hover:before:to-primary/5 hover:before:opacity-100 before:transition-opacity before:duration-500"
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10"
      },
      radius: {
        default: `rounded-${theme.radius.DEFAULT}`,
        lg: `rounded-${theme.radius.lg}`,
        xl: "rounded-[2rem]",
        full: `rounded-${theme.radius.full}`
      }
    },
    defaultVariants: {
      variant: "default",
      hover: "default",
      size: "md",
      radius: "default"
    }
  }
);

export interface GlassmorphicCardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
  gradient?: boolean;
  hoverGradient?: boolean;
  blur?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

export function GlassmorphicCard({
  children,
  className,
  variant,
  hover,
  size,
  radius,
  gradient = false,
  hoverGradient = false,
  blur = "md",
  interactive = false,
  ...props
}: GlassmorphicCardProps) {
  // Map blur values based on theme
  const blurMap = {
    none: "",
    sm: `backdrop-blur-[${theme.effects.blur.sm}]`,
    md: `backdrop-blur-[${theme.effects.blur.md}]`,
    lg: `backdrop-blur-[${theme.effects.blur.lg}]`,
  };
  
  return (
    <div
      className={cn(
        cardVariants({ variant, hover, size, radius }),
        gradient && "bg-gradient-to-br from-white/90 via-white/80 to-white/70",
        blurMap[blur],
        interactive && "cursor-pointer",
        hoverGradient && "hover:bg-gradient-to-br hover:from-primary/5 hover:to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const GlassmorphicCardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
);

export const GlassmorphicCardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent",
      className
    )}
    {...props}
  />
);

export const GlassmorphicCardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export const GlassmorphicCardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative z-10", className)} {...props} />
);

export const GlassmorphicCardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-center pt-4 mt-auto", className)}
    {...props}
  />
);
