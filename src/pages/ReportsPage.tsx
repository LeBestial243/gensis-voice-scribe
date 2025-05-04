
import { useState } from "react";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRequireAuth } from "@/lib/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedReportGenerator } from "@/components/report-generator/UnifiedReportGenerator";
import { FileText } from "lucide-react";
import { StandardizedReportType } from "@/types/reports";

export default function ReportsPage() {
  const { loading } = useRequireAuth();
  const isMobile = useIsMobile();
  
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [reportType, setReportType] = useState<StandardizedReportType>("note");

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const openReportGenerator = (type: StandardizedReportType) => {
    setReportType(type);
    setIsGeneratorOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <AppSidebar />
        <div className="flex-1">
          <Header />
          <main className="container py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-transparent bg-clip-text">
                Rapports
              </h1>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => openReportGenerator("note")}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Nouveau rapport de synthèse
                </Button>
                
                <Button 
                  onClick={() => openReportGenerator("activity")}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Rapport d'activité
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="all">Tous les rapports</TabsTrigger>
                <TabsTrigger value="activity">Rapports d'activité</TabsTrigger>
                <TabsTrigger value="notes">Notes de synthèse</TabsTrigger>
                <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Rapport d'activité trimestriel</CardTitle>
                    <CardDescription>Q1 2023 • Créé le 12/03/2023</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      Ce rapport présente les activités réalisées durant le premier trimestre 2023.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Voir le rapport
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Note de synthèse - Martin Dubois</CardTitle>
                    <CardDescription>Créé le 05/05/2023</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      Synthèse des observations et actions menées sur la période du 01/01/2023 au 30/04/2023.
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Voir le rapport
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="border-dashed flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsGeneratorOpen(true)}>
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-center mb-2">Créer un nouveau rapport</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Générez facilement des rapports à l'aide de l'IA
                  </p>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-6">
                <p className="text-muted-foreground">Rapports d'activité...</p>
              </TabsContent>
              
              <TabsContent value="notes" className="mt-6">
                <p className="text-muted-foreground">Notes de synthèse...</p>
              </TabsContent>
              
              <TabsContent value="evaluations" className="mt-6">
                <p className="text-muted-foreground">Évaluations...</p>
              </TabsContent>
            </Tabs>
          </main>
          
          {isMobile && <MobileNav className="animate-slide-up" />}
        </div>
      </div>
      
      <UnifiedReportGenerator 
        open={isGeneratorOpen} 
        onOpenChange={setIsGeneratorOpen} 
        reportType={reportType}
      />
    </SidebarProvider>
  );
}
