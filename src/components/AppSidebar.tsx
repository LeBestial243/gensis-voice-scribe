
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
    <Sidebar className="border-r">
      <SidebarHeader className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="font-bold text-xl text-primary">GENSYS</div>
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden">
              <PanelLeft className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                >
                  <a href="/" className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    <span>Accueil</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/profiles'}
                >
                  <a href="/profiles" className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Jeunes suivis</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/templates'}
                >
                  <a href="/templates" className="flex items-center gap-2">
                    <FileCode className="h-5 w-5" />
                    <span>Mes templates</span>
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
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
