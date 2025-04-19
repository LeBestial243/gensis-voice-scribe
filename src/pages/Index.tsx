
import { useState } from "react";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Users, Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Index = () => {
  const isMobile = useIsMobile();
  const { loading } = useRequireAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <Header />
          <main className="container mx-auto py-8 px-4 md:px-6 max-w-4xl pb-24">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-title">Bienvenue sur GENSYS</span>
                  <Button onClick={() => navigate('/profiles')} size="sm" className="interactive">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un profil
                  </Button>
                </CardTitle>
                <CardDescription className="text-lg">
                  Gérez vos suivis éducatifs et générez des notes professionnelles avec l'IA
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Button
                variant="default"
                size="lg"
                className="h-32 flex flex-col items-center justify-center gap-2 interactive rounded-xl"
                onClick={() => navigate('/profiles')}
              >
                <Users className="h-8 w-8 text-white" />
                <span className="text-lg font-medium">Accéder aux profils</span>
              </Button>

              <Button
                variant="default"
                size="lg"
                className="h-32 flex flex-col items-center justify-center gap-2 interactive rounded-xl"
                onClick={() => navigate('/templates')}
              >
                <FileText className="h-8 w-8 text-white" />
                <span className="text-lg font-medium">Gérer mes templates</span>
              </Button>
            </div>
          </main>
          {isMobile && <MobileNav className="animate-slide-up" />}
        </div>
      </div>
    </SidebarProvider>
  );
}

export default Index;
