
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
    <Sidebar className="border-r bg-gensys-glassmorphism-light backdrop-blur-sm shadow-md rounded-r-xl ml-4 transition-all duration-300">
      <SidebarHeader className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center gap-2 justify-between w-full">
          <div className="flex items-center">
            <img 
              src="https://ulhlmrjyjhrgktncggav.supabase.co/storage/v1/object/sign/logo/GenSys%20finale.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzBjMjg3MTBiLTZhNWMtNDJjNC04ZWJjLWFkMGM2YzYyNDZmMiJ9.eyJ1cmwiOiJsb2dvL0dlblN5cyBmaW5hbGUuc3ZnIiwiaWF0IjoxNzQ1ODY4MzExLCJleHAiOjE3Nzc0MDQzMTF9.dZaZ2t7-73UWm13qTLYzeWWbkBWM4TM9CY9kb8wDTzU" 
              alt="GENSYS Logo" 
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
          <SidebarGroupLabel className="text-gensys-primary-to font-medium">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  className="hover:bg-gensys-primary-to/10 transition-all duration-300"
                >
                  <Link to="/" className="flex items-center gap-2 no-underline text-inherit">
                    <Home className={`h-5 w-5 ${location.pathname === '/' ? 'text-gensys-primary-to' : ''}`} />
                    <span className={location.pathname === '/' ? 'text-gensys-primary-to' : ''}>Accueil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/profiles'}
                  className="hover:bg-gensys-primary-to/10 transition-all duration-300"
                >
                  <Link to="/profiles" className="flex items-center gap-2 no-underline text-inherit">
                    <Users className={`h-5 w-5 ${location.pathname === '/profiles' ? 'text-gensys-primary-to' : ''}`} />
                    <span className={location.pathname === '/profiles' ? 'text-gensys-primary-to' : ''}>Jeunes suivis</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/templates'}
                  className="hover:bg-gensys-primary-to/10 transition-all duration-300"
                >
                  <Link to="/templates" className="flex items-center gap-2 no-underline text-inherit">
                    <FileCode className={`h-5 w-5 ${location.pathname === '/templates' ? 'text-gensys-primary-to' : ''}`} />
                    <span className={location.pathname === '/templates' ? 'text-gensys-primary-to' : ''}>Mes templates</span>
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
            <LogOut className="mr-2 h-4 w-4 text-gensys-primary-to" />
            Se déconnecter
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
