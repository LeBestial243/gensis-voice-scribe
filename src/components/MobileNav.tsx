
import { Home, FileText, Users } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate, Link } from "react-router-dom";

export function MobileNav({ className }: { className?: string }) {
  const location = useLocation();
  
  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg md:hidden", className)}>
      <div className="container flex items-center justify-around p-2">
        <Link to="/" className="no-underline">
          <Button 
            variant="ghost" 
            size="lg" 
            className={cn(
              "flex flex-col items-center gap-1 h-16",
              location.pathname === "/" && "text-primary"
            )}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Accueil</span>
          </Button>
        </Link>
        
        <Link to="/profiles" className="no-underline">
          <Button 
            variant="ghost" 
            size="lg" 
            className={cn(
              "flex flex-col items-center gap-1 h-16",
              location.pathname === "/profiles" && "text-primary"
            )}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Jeunes</span>
          </Button>
        </Link>
        
        <Link to="/templates" className="no-underline">
          <Button 
            variant="ghost" 
            size="lg" 
            className={cn(
              "flex flex-col items-center gap-1 h-16",
              location.pathname === "/templates" && "text-primary"
            )}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs">Templates</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
}
