
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { InconsistenciesAlert } from "@/components/InconsistenciesAlert";
import { InconsistencyCheck } from "@/types/inconsistency";

interface Folder {
  id: string;
  title: string;
}

interface TranscriptionFormProps {
  transcript: string;
  setTranscript: (text: string) => void;
  selectedFolderId: string;
  setSelectedFolderId: (id: string) => void;
  audioURL: string | null;
  hasTranscriptionError: boolean;
  errorMessage: string | null;
  inconsistencies: string[];
  folders: Folder[];
  error: string | null;
}

export function TranscriptionForm({
  transcript,
  setTranscript,
  selectedFolderId,
  setSelectedFolderId,
  audioURL,
  hasTranscriptionError,
  errorMessage,
  inconsistencies,
  folders,
  error
}: TranscriptionFormProps) {
  const currentDate = format(new Date(), "PPP 'à' HH:mm", { locale: fr });
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Transcription</h3>
      <p className="text-sm text-muted-foreground">{currentDate}</p>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {hasTranscriptionError && (
        <InconsistenciesAlert 
          inconsistencies={inconsistencies?.map(msg => ({
            type: 'other',
            message: msg,
            severity: 'medium' // Changed from 'warning' to 'medium'
          } as InconsistencyCheck))} 
        />
      )}
      
      <Card className={`neumorphic ${hasTranscriptionError ? 'border-2 border-red-500' : ''}`}>
        <CardContent className="pt-6">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className={`min-h-[150px] max-h-[300px] bg-transparent border-0 focus-visible:ring-0 p-0 resize-none ${
              hasTranscriptionError ? 'text-red-600' : ''
            }`}
            placeholder="Votre transcription apparaîtra ici..."
          />
        </CardContent>
      </Card>
      
      {audioURL && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Écouter l'enregistrement</p>
          <audio controls src={audioURL} className="w-full" />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Sélectionner un dossier</label>
        <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
          <SelectTrigger className={hasTranscriptionError ? 'border-red-500' : ''}>
            <SelectValue placeholder="Choisir un dossier" />
          </SelectTrigger>
          <SelectContent>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
