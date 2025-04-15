
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Edit, Download, Trash2, Mic, FileTextIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Type pour les transcriptions
interface Transcription {
  id: string;
  title: string;
  date: string;
  status: "generated" | "draft" | "archived";
  previewText: string;
  type: "vocal" | "ai";
  tags: ("observation" | "incident" | "autre")[];
}

interface TranscriptionsListProps {
  searchQuery: string;
  profileId: string;
}

// Données de test
const mockTranscriptions: Transcription[] = [
  {
    id: "1",
    title: "Entretien avec Alexandre",
    date: "15 avril 2025",
    status: "generated",
    previewText: "Points abordés : progrès en mathématiques, difficultés en lecture, besoin de soutien supplémentaire pour...",
    type: "vocal",
    tags: ["observation"]
  },
  {
    id: "2",
    title: "Réunion équipe éducative",
    date: "14 avril 2025",
    status: "draft",
    previewText: "Décisions : mise en place d'un programme personnalisé, coordination avec l'orthophoniste, implication des parents...",
    type: "ai",
    tags: ["observation", "autre"]
  },
  {
    id: "3",
    title: "Observation Sophie en classe",
    date: "12 avril 2025",
    status: "archived",
    previewText: "Comportement: participation active, interaction limitée avec les pairs, bonne concentration sur les tâches individuelles...",
    type: "vocal",
    tags: ["incident"]
  }
];

export function TranscriptionsList({ searchQuery, profileId }: TranscriptionsListProps) {
  const [filteredTranscriptions, setFilteredTranscriptions] = useState(mockTranscriptions);

  // Filter transcriptions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTranscriptions(mockTranscriptions);
      return;
    }

    const filtered = mockTranscriptions.filter(
      (transcription) =>
        transcription.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.previewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transcription.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setFilteredTranscriptions(filtered);
  }, [searchQuery]);

  // TODO: Replace with actual data fetching when API is ready
  // const { data: transcriptions = [] } = useQuery({
  //   queryKey: ['transcriptions', profileId, searchQuery],
  //   queryFn: async () => {
  //     const { data, error } = await supabase
  //       .from('transcriptions')
  //       .select('*')
  //       .eq('profile_id', profileId)
  //       .order('created_at', { ascending: false });
  //
  //     if (error) throw error;
  //     return data;
  //   },
  // });

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'observation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'incident':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {filteredTranscriptions.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-40">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Aucune transcription disponible</p>
            <p className="text-sm text-muted-foreground">Enregistrez votre voix pour créer votre première transcription</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTranscriptions.map((transcription) => (
            <Card key={transcription.id} className="overflow-hidden neumorphic">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {transcription.type === 'vocal' ? (
                      <Mic className="h-4 w-4 text-primary" />
                    ) : (
                      <FileTextIcon className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-base">{transcription.title}</CardTitle>
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
                <CardDescription className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{transcription.date}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm line-clamp-2 mb-2">{transcription.previewText}</p>
                <div className="flex flex-wrap gap-1">
                  {transcription.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className={getTagColor(tag)}>
                      {tag === 'observation' ? 'Observation' : 
                       tag === 'incident' ? 'Incident' : 'Autre'}
                    </Badge>
                  ))}
                </div>
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
