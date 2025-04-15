
import { UserCircle, Mic, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";

export function MobileNav({ className }: { className?: string }) {
  const location = useLocation();
  const showMic = location.pathname.startsWith('/profile/');
  
  // Extract profile ID from location path if on a profile page
  const getProfileId = () => {
    if (showMic) {
      const pathParts = location.pathname.split('/');
      return pathParts[pathParts.length - 1];
    }
    return null;
  };

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg", className)}>
      <div className="container flex items-center justify-around p-2">
        <Button variant="ghost" size="lg" className="flex flex-col items-center gap-1 h-16">
          <UserCircle className="h-6 w-6" />
          <span className="text-xs">Profils</span>
        </Button>
        
        {showMic && (
          <Button 
            variant="ghost" 
            size="lg" 
            className="flex flex-col items-center gap-1 h-16 -mt-8 rounded-full gradient-bg text-white"
            onClick={() => {
              // Trouve le bouton micro de la page et clique dessus
              const micButton = document.querySelector('.fixed.bottom-24.left-1\\/2.transform.-translate-x-1\\/2') as HTMLButtonElement;
              if (micButton) {
                micButton.click();
              }
            }}
          >
            <Mic className="h-6 w-6" />
            <span className="text-xs">Enregistrer</span>
          </Button>
        )}
        
        <Button variant="ghost" size="lg" className="flex flex-col items-center gap-1 h-16">
          <Settings className="h-6 w-6" />
          <span className="text-xs">Paramètres</span>
        </Button>
      </div>
    </nav>
  );
}
