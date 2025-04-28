
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MorphCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function MorphCard({ 
  children, 
  className, 
  interactive = false,
  onClick 
}: MorphCardProps) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden",
        "border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.05)]",
        "transition-all duration-300 ease-out",
        interactive && "hover:translate-y-[-2px] hover:shadow-[0_14px_40px_rgba(91,134,229,0.15)] cursor-pointer",
        "after:absolute after:inset-0 after:rounded-2xl after:z-[-1]",
        "after:bg-gradient-to-br after:from-gensys-primary-from/5 after:to-gensys-primary-to/5",
        "after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}
