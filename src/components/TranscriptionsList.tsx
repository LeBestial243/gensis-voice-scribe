
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Edit, Download, Trash2 } from "lucide-react";

// Type pour les transcriptions
interface Transcription {
  id: string;
  title: string;
  date: string;
  status: "generated" | "draft" | "archived";
  previewText: string;
}

// Données de test
const mockTranscriptions: Transcription[] = [
  {
    id: "1",
    title: "Entretien avec Alexandre",
    date: "15 avril 2025",
    status: "generated",
    previewText: "Points abordés : progrès en mathématiques, difficultés en lecture, besoin de soutien supplémentaire pour..."
  },
  {
    id: "2",
    title: "Réunion équipe éducative",
    date: "14 avril 2025",
    status: "draft",
    previewText: "Décisions : mise en place d'un programme personnalisé, coordination avec l'orthophoniste, implication des parents..."
  },
  {
    id: "3",
    title: "Observation Sophie en classe",
    date: "12 avril 2025",
    status: "archived",
    previewText: "Comportement: participation active, interaction limitée avec les pairs, bonne concentration sur les tâches individuelles..."
  }
];

export function TranscriptionsList() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Vos transcriptions</h2>
      
      {mockTranscriptions.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune transcription disponible</p>
            <p className="text-sm text-muted-foreground">Enregistrez votre voix pour créer votre première transcription</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mockTranscriptions.map((transcription) => (
            <Card key={transcription.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{transcription.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{transcription.date}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2">{transcription.previewText}</p>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 py-2 px-6">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium">
                    {transcription.status === "generated" && (
                      <span className="text-green-600 dark:text-green-400">
                        Document complet
                      </span>
                    )}
                    {transcription.status === "draft" && (
                      <span className="text-amber-600 dark:text-amber-400">
                        Brouillon
                      </span>
                    )}
                    {transcription.status === "archived" && (
                      <span className="text-gray-500">
                        Archivé
                      </span>
                    )}
                  </span>
                  <Button variant="link" size="sm" className="text-xs h-auto p-0">
                    Voir le document
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
