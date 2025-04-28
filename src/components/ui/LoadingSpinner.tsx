
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20"
  };
  
  return (
    <div className={cn("flex items-center justify-center py-6", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <div className="absolute inset-0 rounded-full border-t-2 border-gensys-primary-from animate-spin"></div>
        <div className="absolute inset-1 rounded-full border-r-2 border-gensys-primary-to animate-spin animate-reverse"></div>
        <div className="absolute inset-2 rounded-full border-b-2 border-gensys-primary-via animate-spin animate-delay-150"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
