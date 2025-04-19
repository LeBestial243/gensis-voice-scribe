
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          {location.pathname !== "/" && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="interactive"
            >
              <ArrowLeft className="h-4 w-4 text-accent" />
            </Button>
          )}
          <div className="font-bold text-xl text-title">GENSYS</div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserCircle className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
