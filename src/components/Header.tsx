
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white/90 backdrop-blur-sm shadow-neumorph rounded-b-xl mx-4">
      <div className="flex items-center gap-2">
        <div className="font-bold text-xl bg-gradient-to-r from-neumorph-secondary to-neumorph-accent text-transparent bg-clip-text">GENSYS</div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="neumorphic" size="icon" className="rounded-full">
          <UserCircle className="h-5 w-5 text-neumorph-accent" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </header>
  );
}
