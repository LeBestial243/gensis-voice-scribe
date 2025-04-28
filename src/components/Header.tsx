
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-gensys-glassmorphism-light backdrop-blur-sm border-b">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
          <img 
            src="https://ulhlmrjyjhrgktncggav.supabase.co/storage/v1/object/sign/logo/GenSys%20finale.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzBjMjg3MTBiLTZhNWMtNDJjNC04ZWJjLWFkMGM2YzYyNDZmMiJ9.eyJ1cmwiOiJsb2dvL0dlblN5cyBmaW5hbGUuc3ZnIiwiaWF0IjoxNzQ1ODY4MzExLCJleHAiOjE3Nzc0MDQzMTF9.dZaZ2t7-73UWm13qTLYzeWWbkBWM4TM9CY9kb8wDTzU" 
            alt="GENSYS Logo" 
            className="h-10 w-auto" 
          />
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
