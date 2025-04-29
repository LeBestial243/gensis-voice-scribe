import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, ChevronDown, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { FileType } from "@/types/files";

interface FolderSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
}

// Utilisez les deux méthodes d'export pour maintenir la compatibilité
export function FolderSelector({
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect
}: FolderSelectorProps) {
  // Le reste du code reste identique
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [folderStats, setFolderStats] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Utilisez useCallback pour les fonctions
  const handleFolderClick = useCallback((folderId: string) => {
    // Le reste du code pour handleFolderClick
    // ...
  }, [folderStats, selectedFolders, selectedFiles, onFolderSelect, onFileSelect]);
  
  // Le reste du composant reste identique
  
  return (
    // JSX du composant
  );
}

// Vous pouvez également exporter une version optimisée avec memo
export const MemoizedFolderSelector = memo(FolderSelector);

// Ne pas utiliser export default ici pour éviter les conflits