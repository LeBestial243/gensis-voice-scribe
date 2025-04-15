
import { useState } from "react";
import { Header } from "@/components/Header";
import { TemplatesList } from "@/components/templates/TemplatesList";
import { TemplateCreationForm } from "@/components/templates/TemplateCreationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { useRequireAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TemplatesPage() {
  const { loading } = useRequireAuth();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 container py-8">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Mes modèles IA</CardTitle>
                <CardDescription>
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
              onEditTemplate={(templateId) => setEditingTemplateId(templateId)} 
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
