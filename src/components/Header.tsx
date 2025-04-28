
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserCircle, Menu } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-4 z-40 mx-4 my-2 transition-all duration-300">
      <div className="relative overflow-hidden rounded-2xl backdrop-blur-lg bg-white/80 shadow-xl border border-white/20">
        <div className="absolute inset-0 bg-gradient-to-r from-gensys-primary-from/10 to-gensys-primary-to/10 opacity-50"></div>
        <div className="container flex items-center justify-between h-16 relative z-10">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="rounded-full md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </Button>
            <img 
              src="https://ulhlmrjyjhrgktncggav.supabase.co/storage/v1/object/sign/logo/GenSys%20finale.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzBjMjg3MTBiLTZhNWMtNDJjNC04ZWJjLWFkMGM2YzYyNDZmMiJ9.eyJ1cmwiOiJsb2dvL0dlblN5cyBmaW5hbGUuc3ZnIiwiaWF0IjoxNzQ1ODY4MzExLCJleHAiOjE3Nzc0MDQzMTF9.dZaZ2t7-73UWm13qTLYzeWWbkBWM4TM9CY9kb8wDTzU" 
              alt="GENSYS Logo" 
              className="h-8 w-auto" 
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
