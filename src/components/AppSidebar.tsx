
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Users, FileText, Settings, LogOut, BarChart2, PanelLeft, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Sidebar className="border-r bg-white/90 backdrop-blur-sm shadow-neumorph rounded-r-xl ml-4 transition-all duration-300">
      <SidebarHeader className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="font-bold text-xl bg-gradient-to-r from-neumorph-secondary to-neumorph-accent text-transparent bg-clip-text">GENSYS</div>
          <SidebarTrigger>
            <Button variant="neumorphic" size="icon" className="md:hidden rounded-lg">
              <PanelLeft className="h-5 w-5 text-neumorph-accent" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-neumorph-accent font-medium">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  className="hover:bg-accent/10 transition-all duration-300"
                >
                  <a href="/" className="flex items-center gap-2">
                    <Home className={`h-5 w-5 ${location.pathname === '/' ? 'text-neumorph-accent' : ''}`} />
                    <span className={location.pathname === '/' ? 'text-neumorph-accent' : ''}>Accueil</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/profiles'}
                  className="hover:bg-accent/10 transition-all duration-300"
                >
                  <a href="/profiles" className="flex items-center gap-2">
                    <Users className={`h-5 w-5 ${location.pathname === '/profiles' ? 'text-neumorph-accent' : ''}`} />
                    <span className={location.pathname === '/profiles' ? 'text-neumorph-accent' : ''}>Jeunes suivis</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/templates'}
                  className="hover:bg-accent/10 transition-all duration-300"
                >
                  <a href="/templates" className="flex items-center gap-2">
                    <FileCode className={`h-5 w-5 ${location.pathname === '/templates' ? 'text-neumorph-accent' : ''}`} />
                    <span className={location.pathname === '/templates' ? 'text-neumorph-accent' : ''}>Mes templates</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-6 py-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4 text-neumorph-accent" />
            Se déconnecter
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
