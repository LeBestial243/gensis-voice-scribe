
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { getErrorStyleClass } from "@/utils/transcription-utils";

interface TranscriptionFormProps {
  transcript: string;
  onTranscriptChange: (text: string) => void;
  error: string | null;
  hasError: boolean;
  currentDate: string;
}

export function TranscriptionForm({
  transcript,
  onTranscriptChange,
  error,
  hasError,
  currentDate
}: TranscriptionFormProps) {
  return (
    <>
      <h3 className="text-xl font-bold">Transcription</h3>
      <p className="text-sm text-muted-foreground">{currentDate}</p>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {hasError && (
        <Alert variant="destructive" className="border-red-500">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Attention : Cette transcription semble contenir des erreurs ou des incohérences. 
            Veuillez vérifier le contenu avant de sauvegarder.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className={`neumorphic ${getErrorStyleClass(hasError)}`}>
        <CardContent className="pt-6">
          <Textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className={`min-h-[150px] bg-transparent border-0 focus-visible:ring-0 p-0 resize-none
              ${hasError ? 'text-red-600' : ''}`}
            placeholder="Votre transcription apparaîtra ici..."
          />
        </CardContent>
      </Card>
    </>
  );
}
