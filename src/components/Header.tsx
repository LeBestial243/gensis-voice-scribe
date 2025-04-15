
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b">
      <div className="flex items-center gap-2">
        <div className="font-bold text-xl text-primary">GENSYS</div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <UserCircle className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Button>
      </div>
    </header>
  );
}
