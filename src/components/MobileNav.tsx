
import { UserCircle, Mic, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function MobileNav({ className }: { className?: string }) {
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg", className)}>
      <div className="container flex items-center justify-around p-2">
        <Button variant="ghost" size="lg" className="flex flex-col items-center gap-1 h-16 interactive">
          <UserCircle className="h-6 w-6" />
          <span className="text-xs">Profils</span>
        </Button>
        
        <Button variant="ghost" size="lg" className="flex flex-col items-center gap-1 h-16 -mt-8 rounded-full gradient-bg text-white interactive">
          <Mic className="h-6 w-6" />
          <span className="text-xs">Enregistrer</span>
        </Button>
        
        <Button variant="ghost" size="lg" className="flex flex-col items-center gap-1 h-16 interactive">
          <Settings className="h-6 w-6" />
          <span className="text-xs">Paramètres</span>
        </Button>
      </div>
    </nav>
  );
}
