import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, ChevronDown, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FileType } from "@/types/files";

interface FolderSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

interface FolderWithFiles {
  id: string;
  title: string;
  created_at: string;
  files: FileType[];
}

interface FolderWithStats extends FolderWithFiles {
  fileCount: number;
  relevantFileCount: number;
}

export function FolderSelector({
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect
}: FolderSelectorProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [folderStats, setFolderStats] = useState<FolderWithStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les dossiers et leurs fichiers
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["folders", profileId],
    queryFn: async () => {
      try {
        console.log("Fetching folders for profile:", profileId);
        
        const { data, error } = await supabase
          .from("folders")
          .select(`
            id,
            title,
            created_at,
            files (
              id,
              name,
              type,
              size,
              path,
              folder_id,
              created_at,
              updated_at,
              content
            )
          `)
          .eq("profile_id", profileId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching folders:", error);
          setError("Erreur lors du chargement des dossiers");
          throw error;
        }

        // Log détaillé pour le débogage
        console.log("Raw folders data:", JSON.stringify(data, null, 2));
        
        return data as FolderWithFiles[] || [];
      } catch (err) {
        console.error("Failed to fetch folders:", err);
        setError("Erreur lors du chargement des dossiers");
        return [];
      }
    },
    enabled: !!profileId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Calculer les statistiques des dossiers (nombre total de fichiers, fichiers pertinents)
  useEffect(() => {
    if (!folders) {
      setFolderStats([]);
      return;
    }

    const stats = folders.map((folder) => {
      // S'assurer que files est un tableau
      const files = Array.isArray(folder.files) ? folder.files : [];
      
      // Nombre total de fichiers
      const fileCount = files.length;
      
      // Nombre de fichiers pertinents (transcriptions, texte)
      const relevantFiles = files.filter(
        (file) =>
          file.type === "transcription" ||
          file.type === "text" ||
          file.type === "text/plain" ||
          (file.name && file.name.toLowerCase().includes("transcription"))
      );
      
      const relevantFileCount = relevantFiles.length;
      
      console.log(`Folder "${folder.title}": ${fileCount} files, ${relevantFileCount} relevant`);
      
      return {
        ...folder,
        fileCount,
        relevantFileCount,
      };
    });

    setFolderStats(stats);
  }, [folders]);

  // Gérer l'auto-expansion des dossiers sélectionnés
  useEffect(() => {
    if (!folders || folders.length === 0) return;
    
    // Trouver les dossiers qui ont des fichiers sélectionnés et les étendre
    const foldersToExpand = folders
      .filter(folder => {
        const files = Array.isArray(folder.files) ? folder.files : [];
        const hasSelectedFiles = files.some(file => selectedFiles.includes(file.id));
        return hasSelectedFiles || selectedFolders.includes(folder.id);
      })
      .map(folder => folder.id);
    
    // Mettre à jour les dossiers étendus
    if (foldersToExpand.length > 0) {
      setExpandedFolders(prev => {
        const newExpanded = [...prev];
        foldersToExpand.forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id);
          }
        });
        return newExpanded;
      });
    }
  }, [folders, selectedFolders, selectedFiles]);
  
  // Gérer le clic sur un dossier
  const handleFolderClick = (folderId: string) => {
    console.log("Folder clicked:", folderId);
    onFolderSelect(folderId);
    
    // Auto-expand lorsqu'un dossier est sélectionné
    if (!expandedFolders.includes(folderId)) {
      setExpandedFolders(prev => [...prev, folderId]);
    }
  };

  // Gérer le clic sur le bouton d'expansion
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Dossiers disponibles</h3>
          <Skeleton className="h-6 w-24" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 text-red-700 bg-red-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-medium">Erreur</h3>
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Affichage si aucun dossier n'est trouvé
  if (folderStats.length === 0) {
    return (
      <div className="border border-dashed rounded-lg p-6 text-center">
        <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-500">Aucun dossier disponible</p>
      </div>
    );
  }

  // Affichage principal des dossiers et fichiers
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Dossiers disponibles</h3>
        <div className="flex gap-2">
          <Badge variant="secondary">
            {selectedFolders.length} dossier(s)
          </Badge>
          {selectedFiles.length > 0 && (
            <Badge variant="outline" className="bg-purple-50">
              {selectedFiles.length} fichier(s)
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {folderStats.map((folder) => {
          const isSelected = selectedFolders.includes(folder.id);
          const isExpanded = expandedFolders.includes(folder.id);
          
          return (
            <div key={folder.id} className="space-y-2">
              {/* Carte du dossier */}
              <Card
                className={cn(
                  "transition-all duration-200 cursor-pointer",
                  isSelected
                    ? "border-purple-500 bg-purple-50/50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                )}
                onClick={() => handleFolderClick(folder.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      className="mt-1"
                      onCheckedChange={() => handleFolderClick(folder.id)}
                      onClick={(e) => e.stopPropagation()}
                      id={`folder-checkbox-${folder.id}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-1"
                          onClick={(e) => toggleFolderExpand(folder.id, e)}
                          aria-label={isExpanded ? "Replier le dossier" : "Développer le dossier"}
                        >
                          {folder.fileCount > 0 && (
                            isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )
                          )}
                          <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </button>
                        <label 
                          htmlFor={`folder-checkbox-${folder.id}`}
                          className="font-medium text-sm truncate cursor-pointer flex-grow"
                        >
                          {folder.title}
                        </label>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          {folder.fileCount} fichier(s) total
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {folder.relevantFileCount} transcription(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Liste des fichiers du dossier (visible si le dossier est étendu) */}
              {isExpanded && (
                <div className="ml-8">
                  {Array.isArray(folder.files) && folder.files.length > 0 ? (
                    <div className="space-y-1 border-l-2 border-gray-100 pl-2">
                      {folder.files.map((file) => {
                        const isRelevant =
                          file.type === "transcription" ||
                          file.type === "text" ||
                          file.type === "text/plain" ||
                          file.name.toLowerCase().includes("transcription");
                          
                        const isSelected = selectedFiles.includes(file.id);
                        
                        return (
                          <div
                            key={file.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md cursor-pointer",
                              isSelected
                                ? "border border-purple-300 bg-purple-50 shadow-sm"
                                : "border border-gray-100 bg-gray-50 hover:border-gray-300",
                              isRelevant ? "border-l-2 border-l-purple-300" : ""
                            )}
                            onClick={() => onFileSelect(file.id)}
                          >
                            <Checkbox
                              id={`file-checkbox-${file.id}`}
                              checked={isSelected}
                              className="mr-1"
                              onCheckedChange={() => onFileSelect(file.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <FileText
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                isRelevant ? "text-purple-400" : "text-gray-400"
                              )}
                            />
                            <label 
                              htmlFor={`file-checkbox-${file.id}`}
                              className="text-sm text-gray-600 truncate flex-grow cursor-pointer"
                            >
                              {file.name}
                            </label>
                            <Badge
                              variant={isRelevant ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {file.type === "transcription"
                                ? "Transcription"
                                : file.type === "text" || file.type === "text/plain"
                                ? "Texte"
                                : file.type}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-2 text-xs text-gray-500 italic">
                      Aucun fichier dans ce dossier
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
