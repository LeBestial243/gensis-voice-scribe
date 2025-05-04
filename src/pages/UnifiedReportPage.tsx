
import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedReportGenerator } from "@/components/report-generator/UnifiedReportGenerator";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { FileText, FilePlus2 } from "lucide-react";

export default function UnifiedReportPage() {
  const { profileId } = useParams<{ profileId?: string }>();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [reportType, setReportType] = useState<"activity" | "standardized" | "note" | "evaluation">("note");
  const isMobile = useIsMobile();

  const handleOpenGenerator = (type: "activity" | "standardized" | "note" | "evaluation") => {
    setReportType(type);
    setIsGeneratorOpen(true);
  };

  const getReportTypeTitle = (type: string) => {
    switch (type) {
      case "activity": return "Rapport d'activité";
      case "standardized": return "Rapport standardisé";
      case "evaluation": return "Rapport d'évaluation";
      case "note":
      default: return "Note de synthèse";
    }
  };

  const getReportTypeDescription = (type: string) => {
    switch (type) {
      case "activity": 
        return "Résumez vos activités sur une période donnée avec statistiques et points clés.";
      case "standardized": 
        return "Rapport formaté selon les exigences spécifiques de votre institution.";
      case "evaluation": 
        return "Évaluez les progrès et résultats d'un accompagnement social.";
      case "note":
      default: 
        return "Résumez les points importants d'un dossier ou d'une situation spécifique.";
    }
  };

  const reportTypes: ("activity" | "standardized" | "note" | "evaluation")[] = [
    "activity",
    "standardized",
    "note",
    "evaluation"
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 container py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neumorph-secondary to-neumorph-accent text-transparent bg-clip-text">
                Générateur de rapports unifié
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                {profileId 
                  ? "Créez différents types de rapports pour ce profil" 
                  : "Créez différents types de rapports pour votre travail social"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reportTypes.map(type => (
                <Card key={type} className="shadow-neumorph hover:shadow-neumorph-hover transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className={`h-5 w-5 ${
                        type === "activity" ? "text-purple-500" :
                        type === "standardized" ? "text-indigo-500" :
                        type === "evaluation" ? "text-green-500" :
                        "text-blue-500"
                      }`} />
                      {getReportTypeTitle(type)}
                    </CardTitle>
                    <CardDescription>
                      {type === "activity" 
                        ? "Mensuel, trimestriel ou annuel" 
                        : type === "standardized"
                        ? "Selon les normes institutionnelles"
                        : type === "evaluation"
                        ? "Pour le suivi des objectifs"
                        : "Basée sur les observations"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-gray-600">
                      {getReportTypeDescription(type)}
                    </p>
                    <Button 
                      onClick={() => handleOpenGenerator(type)} 
                      className={`w-full ${
                        type === "activity" ? "bg-gradient-to-r from-purple-500 to-indigo-600" :
                        type === "standardized" ? "bg-gradient-to-r from-indigo-500 to-blue-600" :
                        type === "evaluation" ? "bg-gradient-to-r from-green-500 to-teal-600" :
                        "bg-gradient-to-r from-blue-500 to-teal-600"
                      }`}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Créer {type === "note" ? "une" : "un"} {getReportTypeTitle(type).toLowerCase()}
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
