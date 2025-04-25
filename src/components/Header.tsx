
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-2">
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
