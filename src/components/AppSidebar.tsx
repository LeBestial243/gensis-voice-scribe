
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
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <Sidebar className="border-r bg-white/90 backdrop-blur-sm shadow-md rounded-r-xl ml-4 transition-all duration-300">
      <SidebarHeader className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="font-bold text-xl bg-gradient-to-r from-secondary to-accent text-transparent bg-clip-text">GENSYS</div>
          <SidebarTrigger>
            <Button variant="ghost" size="icon" className="md:hidden rounded-lg">
              <PanelLeft className="h-5 w-5 text-accent" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </SidebarTrigger>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-accent font-medium">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  className="hover:bg-accent/10 transition-all duration-300"
                >
                  <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
                    <Home className={`h-5 w-5 ${location.pathname === '/' ? 'text-accent' : ''}`} />
                    <span className={location.pathname === '/' ? 'text-accent' : ''}>Accueil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/profiles'}
                  className="hover:bg-accent/10 transition-all duration-300"
                >
                  <Link to="/profiles" className="flex items-center gap-2 no-underline text-inherit">
                    <Users className={`h-5 w-5 ${location.pathname === '/profiles' ? 'text-accent' : ''}`} />
                    <span className={location.pathname === '/profiles' ? 'text-accent' : ''}>Jeunes suivis</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/templates'}
                  className="hover:bg-accent/10 transition-all duration-300"
                >
                  <Link to="/templates" className="flex items-center gap-2 no-underline text-inherit">
                    <FileCode className={`h-5 w-5 ${location.pathname === '/templates' ? 'text-accent' : ''}`} />
                    <span className={location.pathname === '/templates' ? 'text-accent' : ''}>Mes templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-6 py-3">
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4 text-accent" />
            Se déconnecter
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
