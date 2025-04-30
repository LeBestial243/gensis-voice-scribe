
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { UserCircle, Menu } from "lucide-react";
import { PremiumHeader } from "@/components/PremiumHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function Header() {
  const isMobile = useIsMobile();
  
  return (
    <PremiumHeader
      title="GENSYS"
      subtitle="Suivi de parcours"
      userName="User Name"
      showSearch={true}
      showNotifications={true}
      sticky={true}
      transparent={false}
      sidebar={isMobile ? <AppSidebar /> : undefined}
      className="mx-0 my-0"
    />
  );
}
