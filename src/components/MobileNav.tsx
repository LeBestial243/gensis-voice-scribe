
import { Home, FileText, Users, FileCode } from "lucide-react";
import { useLocation } from "react-router-dom";
import { ModernNavigation } from "./navigation/ModernNavigation";
import { cn } from "@/lib/utils";

export function MobileNav({ className }: { className?: string }) {
  const location = useLocation();
  
  const navigationLinks = [
    {
      path: "/",
      label: "Accueil",
      icon: <Home className="h-5 w-5" />
    },
    {
      path: "/profiles",
      label: "Jeunes",
      icon: <Users className="h-5 w-5" />
    },
    {
      path: "/templates",
      label: "Templates",
      icon: <FileCode className="h-5 w-5" />
    }
  ];

  return (
    <ModernNavigation 
      links={navigationLinks}
      className={cn("md:hidden", className)}
    />
  );
}
