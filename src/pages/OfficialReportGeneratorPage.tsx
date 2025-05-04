
import { useState } from 'react';
import { UnifiedReportGenerator } from '@/components/report-generator/UnifiedReportGenerator';
import { Button } from '@/components/ui/button';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider } from '@/components/ui/sidebar';
import { MobileNav } from '@/components/MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useParams } from 'react-router-dom';
import { FileText, FilePlus2 } from 'lucide-react';

export default function OfficialReportGeneratorPage() {
  const { profileId = "" } = useParams();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [reportType, setReportType] = useState<"activity" | "standardized" | "note" | "evaluation">("standardized");
  const isMobile = useIsMobile();

  const handleOpenGenerator = (type: "activity" | "standardized" | "note" | "evaluation") => {
    setReportType(type);
    setIsGeneratorOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 container py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neumorph-secondary to-neumorph-accent text-transparent bg-clip-text">
                Générateur de rapports officiels
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Créez différents types de rapports pour votre travail social
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="shadow-neumorph hover:shadow-neumorph-hover transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Rapport d'activité
                  </CardTitle>
                  <CardDescription>
                    Créez un rapport d'activité mensuel, trimestriel ou annuel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-gray-600">
                    Résumez vos activités sur une période donnée avec statistiques et points clés.
                  </p>
                  <Button 
                    onClick={() => handleOpenGenerator("activity")} 
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600"
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Créer un rapport d'activité
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-neumorph hover:shadow-neumorph-hover transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-500" />
                    Rapport standardisé
                  </CardTitle>
                  <CardDescription>
                    Générez un rapport selon les normes institutionnelles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-gray-600">
                    Rapport formaté selon les exigences spécifiques de votre institution.
                  </p>
                  <Button 
                    onClick={() => handleOpenGenerator("standardized")} 
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-600"
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Créer un rapport standardisé
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-neumorph hover:shadow-neumorph-hover transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Note de synthèse
                  </CardTitle>
                  <CardDescription>
                    Créez une note de synthèse basée sur vos observations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-gray-600">
                    Résumez les points importants d'un dossier ou d'une situation spécifique.
                  </p>
                  <Button 
                    onClick={() => handleOpenGenerator("note")} 
                    className="w-full bg-gradient-to-r from-blue-500 to-teal-600"
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Créer une note de synthèse
                  </Button>
                </CardContent>
              </Card>
            </div>

            <UnifiedReportGenerator
              open={isGeneratorOpen}
              onOpenChange={setIsGeneratorOpen}
              profileId={profileId}
              reportType={reportType}
            />
          </main>
          {isMobile && <MobileNav className="animate-slide-up" />}
        </div>
      </div>
    </SidebarProvider>
  );
}
