
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Bell, Search, User, Menu } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationSystem } from "@/components/NotificationSystem";

interface PremiumHeaderProps {
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  showNotifications?: boolean;
  userName?: string;
  userImageUrl?: string;
  className?: string;
  transparent?: boolean;
  sticky?: boolean;
  sidebar?: React.ReactNode;
}

export function PremiumHeader({
  title = "GENSYS",
  subtitle,
  showSearch = true,
  onSearch,
  showNotifications = true,
  userName,
  userImageUrl,
  className,
  transparent = false,
  sticky = true,
  sidebar,
}: PremiumHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const isMobile = useIsMobile();
  
  // Effet de transition au scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Calculer la position initiale de l'avatar pour l'animation du text
  const userInitials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "GS";
  
  return (
    <header
      className={cn(
        "w-full z-30 transition-all duration-300",
        sticky && "sticky top-0",
        scrolled 
          ? "py-2 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20" 
          : transparent 
            ? "py-4 bg-transparent" 
            : "py-4 bg-white/60 backdrop-blur-sm",
        className
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo et titre */}
        <div className="flex items-center gap-3">
          {isMobile && sidebar && (
            <Sheet>
              <SheetTrigger asChild>
                <PremiumButton variant="glassmorphic" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                </PremiumButton>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                {sidebar}
              </SheetContent>
            </Sheet>
          )}
          
          <div className="flex flex-col">
            <h1 className={cn(
              "font-bold transition-all",
              scrolled ? "text-xl" : "text-2xl",
              "bg-gradient-to-r from-gensys-primary-from to-gensys-primary-to bg-clip-text text-transparent"
            )}>
              {title}
            </h1>
            {subtitle && (
              <p className={cn(
                "text-muted-foreground transition-all",
                scrolled ? "text-xs" : "text-sm"
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Barre de recherche */}
          {showSearch && !isMobile && (
            <div className={cn(
              "relative rounded-full overflow-hidden transition-all duration-300 ease-in-out",
              "bg-white/70 hover:bg-white/90 focus-within:bg-white/90",
              "border border-white/30 focus-within:border-gensys-primary-to/30",
              "shadow-sm focus-within:shadow-md",
              "focus-within:ring-1 focus-within:ring-gensys-primary-to/20",
              scrolled ? "w-48" : "w-64"
            )}>
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  onSearch && onSearch(e.target.value);
                }}
                placeholder="Rechercher..."
                className="w-full h-9 pl-9 pr-3 bg-transparent border-none focus:outline-none text-sm placeholder:text-gray-400"
              />
            </div>
          )}
          
          {/* Notifications */}
          {showNotifications && (
            <div className="relative">
              <NotificationSystem />
            </div>
          )}
          
          {/* Profil utilisateur */}
          <div>
            <Avatar className={cn(
              "border-2 border-white",
              "transition-all duration-300 ease-in-out",
              "bg-gradient-to-br from-gensys-primary-from/10 to-gensys-primary-to/20",
              scrolled ? "h-9 w-9" : "h-10 w-10"
            )}>
              <AvatarImage src={userImageUrl} />
              <AvatarFallback 
                className="bg-gradient-to-br from-gensys-primary-from/20 to-gensys-primary-to/20 text-gensys-primary-to font-medium"
              >
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
