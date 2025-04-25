
import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Clock, Edit, Download, Trash2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FileData } from "@/types/files";

interface TranscriptionCardProps {
  file: FileData;
  onDelete: (id: string) => void;
  onDownload: (file: FileData) => void;
}

export function TranscriptionCard({ file, onDelete, onDownload }: TranscriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card key={file.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-2">
            {file.type.includes('audio') ? (
              <FileText className="h-5 w-5 text-blue-500" />
            ) : (
              <FileText className="h-5 w-5 text-emerald-500" />
            )}
            <div>
              <CardTitle className="text-base">{file.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  {file.created_at && formatDistanceToNow(parseISO(file.created_at), { 
                    addSuffix: true, 
                    locale: fr 
                  })}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline">
              {file.type.includes('audio') ? 'Audio' : 'Transcription'}
            </Badge>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownload(file)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(file.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-sm ${isExpanded ? '' : 'line-clamp-2'}`}>
          {file.content || "Aucun contenu disponible"}
        </p>
        {file.content && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs h-auto p-0 mt-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Voir moins" : "Voir plus"}
          </Button>
        )}
      </CardContent>
      <CardFooter className="border-t bg-muted/30 py-2 px-6">
        <div className="flex items-center gap-2">
          {file.type.includes('audio') && (
            <Button size="sm" variant="secondary" className="h-8">
              <Play className="h-3 w-3 mr-1" />
              Écouter
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8">
            <Edit className="h-3 w-3 mr-1" />
            Éditer
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
