
import { Home, FileText, Settings, Users } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

export function MobileNav({ className }: { className?: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden", className)}>
      <div className="container flex items-center justify-around p-2">
        <Button 
          variant="ghost" 
          size="lg" 
          className={cn(
            "flex flex-col items-center gap-1 h-16",
            location.pathname === "/" && "text-primary"
          )}
          onClick={() => navigate('/')}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs">Accueil</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="lg" 
          className={cn(
            "flex flex-col items-center gap-1 h-16",
            location.pathname === "/profiles" && "text-primary"
          )}
          onClick={() => navigate('/profiles')}
        >
          <Users className="h-6 w-6" />
          <span className="text-xs">Jeunes</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="lg" 
          className={cn(
            "flex flex-col items-center gap-1 h-16",
            location.pathname === "/templates" && "text-primary"
          )}
          onClick={() => navigate('/templates')}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs">Templates</span>
        </Button>
      </div>
    </nav>
  );
}
