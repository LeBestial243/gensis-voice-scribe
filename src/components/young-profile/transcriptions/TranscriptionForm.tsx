
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { checkTranscriptionError } from "@/utils/transcription-utils";

interface TranscriptionFormProps {
  transcript: string;
  onTranscriptChange: (text: string) => void;
  error: string | null;
  transcriptionError: boolean;
  currentDate: string;
}

export function TranscriptionForm({
  transcript,
  onTranscriptChange,
  error,
  transcriptionError,
  currentDate,
}: TranscriptionFormProps) {
  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    onTranscriptChange(newText);
  };

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
      
      {transcriptionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>
            Cette transcription semble contenir des erreurs. Veuillez vérifier le contenu avant de sauvegarder.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className={`neumorphic ${transcriptionError ? 'border-2 border-destructive' : ''}`}>
        <CardContent className="pt-6">
          <Textarea
            value={transcript}
            onChange={handleTranscriptChange}
            className="min-h-[150px] bg-transparent border-0 focus-visible:ring-0 p-0 resize-none"
            placeholder="Votre transcription apparaîtra ici..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
