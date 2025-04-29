
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface FileSelectorProps {
  profileId: string;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

export interface FileWithContent {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string | null;
  path: string;
  size: number;
  folder_id: string;
  content?: string;
}

export function FileSelector({ profileId, selectedFiles, onFileSelect }: FileSelectorProps) {
  console.log('FileSelector: profileId =', profileId);

  // D'abord, récupérer tous les dossiers du profil
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('id, title')
        .eq('profile_id', profileId);

      if (error) {
        console.error('Error fetching folders:', error);
        throw error;
      }
      console.log('Folders found:', data);
      return data || [];
    },
    enabled: !!profileId,
  });

  // Ensuite, récupérer tous les fichiers de ces dossiers
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files', folders.map(f => f.id).join(',')],
    queryFn: async () => {
      if (folders.length === 0) return [];

      const folderIds = folders.map(folder => folder.id);
      console.log('Fetching files for folders:', folderIds);

      const { data, error } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', folderIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        throw error;
      }
      console.log('Files found:', data);
      return data || [];
    },
    enabled: folders.length > 0,
  });

  // Filtrer pour ne garder que les fichiers de transcription ou de type texte
  const transcriptionFiles = files.filter(file => 
    file.type === 'transcription' || 
    file.type === 'text' || 
    file.type === 'text/plain' ||
    file.name.toLowerCase().includes('transcription')
  );

  console.log('Transcription files:', transcriptionFiles);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeLabel = (type: string, name: string) => {
    if (type === 'transcription' || name.toLowerCase().includes('transcription')) {
      return 'Transcription';
    }
    return 'Document';
  };

  if (foldersLoading || filesLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (transcriptionFiles.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500 py-6">
          <FileText className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p>Aucun fichier texte disponible</p>
          <p className="text-sm mt-1">Commencez par enregistrer des observations</p>
          {folders.length === 0 && (
            <p className="text-sm mt-1 text-red-500">Aucun dossier trouvé pour ce profil</p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Documents disponibles</h3>
        <Badge variant="secondary">
          {selectedFiles.length} fichier(s) sélectionné(s)
        </Badge>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Sélectionnez les documents à utiliser pour générer la note
      </p>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {transcriptionFiles.map((file) => {
          const isSelected = selectedFiles.includes(file.id);
          return (
            <Card 
              key={file.id} 
              className={`
                transition-all duration-200 cursor-pointer border
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
              onClick={() => onFileSelect(file.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={isSelected}
                    className="mt-1"
                    onCheckedChange={() => onFileSelect(file.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(file.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(file.type, file.name)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
