
import { Home, Users, FileCode, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import appConfig from '@/config/appConfig';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { PremiumDesktopNavigation } from "./navigation/PremiumDesktopNavigation";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  
  const navigationLinks = [
    {
      path: "/",
      label: "Accueil",
      icon: <Home className="h-5 w-5" />
    },
    {
      path: "/profiles",
      label: "Jeunes suivis",
      icon: <Users className="h-5 w-5" />
    },
    {
      path: "/templates",
      label: "Mes templates",
      icon: <FileCode className="h-5 w-5" />
    }
  ];

  return (
    <Sidebar className="border-r bg-gensys-glassmorphism-light backdrop-blur-sm shadow-md rounded-r-xl ml-4 transition-all duration-300">
      <SidebarHeader className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="flex items-center">
            <img 
              src={appConfig.app.logo.main}
              alt={`${appConfig.app.company} Logo`}
              className="h-8 w-auto mr-2" 
            />
          </div>
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden rounded-lg">
              <PanelLeft className="h-5 w-5 text-gensys-primary-to" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <PremiumDesktopNavigation links={navigationLinks} className="mx-3" />
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-6 py-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4 text-gensys-primary-to" />
            Se déconnecter
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
