
import { useState } from "react";
import { Header } from "@/components/Header";
import { TemplatesList } from "@/components/templates/TemplatesList";
import { TemplateCreationForm } from "@/components/templates/TemplateCreationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useRequireAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Template } from "@/types/reports";

export default function TemplatesPage() {
  const { loading } = useRequireAuth();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neumorph-accent"></div>
      </div>
    );
  }

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
  };

  const handleSelectTemplate = (templateId: string) => {
    // Handle template selection if needed
    console.log("Selected template:", templateId);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 container py-8">
            <Card className="mb-8 neumorphic hover:shadow-neumorph-hover transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-neumorph-secondary to-neumorph-accent text-transparent bg-clip-text">Mes modèles IA</CardTitle>
                <CardDescription className="text-lg">
                  Créez vos propres structures pour générer automatiquement des notes à partir des observations de terrain.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateCreationForm 
                  editingTemplateId={editingTemplateId} 
                  onEditComplete={() => setEditingTemplateId(null)} 
                />
              </CardContent>
            </Card>

            <TemplatesList 
              onSelect={handleSelectTemplate}
              onEdit={(template: Template) => handleEditTemplate(template.id)} 
              showStructureFilter
            />
          </main>
          {isMobile && <MobileNav className="animate-slide-up" />}
        </div>
      </div>
    </SidebarProvider>
  );
}
