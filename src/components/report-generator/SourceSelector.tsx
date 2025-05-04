
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { FolderList } from "@/components/folder-display/FolderList";
import { FolderFileList } from "@/components/young-profile/generate-note/FolderFileList";
import { FileType } from "@/types/files";
import { ReportMetadata, ReportResourceType } from "@/types/reports";

interface SourceSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  reportMetadata: ReportMetadata;
  onMetadataChange: (metadata: ReportMetadata) => void;
  reportType?: ReportResourceType;
}

export function SourceSelector({
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect,
  reportMetadata,
  onMetadataChange,
  reportType,
}: SourceSelectorProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId,
  });
  
  // Fetch folder counts - fixing the deep type instantiation error
  const { data: folderCounts = {} } = useQuery({
    queryKey: ['folder_counts', profileId],
    queryFn: async () => {
      // Direct SQL query approach to avoid deep type instantiation issue
      const { data, error } = await supabase
        .rpc('get_folder_file_counts', { profile_id_param: profileId });
      
      if (error) {
        console.error('Error fetching folder counts:', error);
        return {};
      }
      
      // Convert the result to a more usable format
      return data?.reduce((acc: Record<string, number>, item: any) => {
        if (item.folder_id) {
          acc[item.folder_id] = parseInt(item.count);
        }
        return acc;
      }, {}) || {};
    },
    enabled: !!profileId,
  });
  
  // Fetch files for active folder
  const { data: folderFiles = [] } = useQuery({
    queryKey: ['folder_files', activeFolderId],
    queryFn: async () => {
      if (!activeFolderId) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', activeFolderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FileType[] || [];
    },
    enabled: !!activeFolderId,
  });
  
  // Handle metadata changes
  const handleStartDateChange = (date: Date | undefined) => {
    onMetadataChange({
      ...reportMetadata,
      periodStart: date ? date.toISOString() : undefined
    });
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    onMetadataChange({
      ...reportMetadata,
      periodEnd: date ? date.toISOString() : undefined
    });
  };
  
  const handleFolderSelection = (folderId: string) => {
    if (activeFolderId === folderId) {
      setActiveFolderId(null);
    } else {
      setActiveFolderId(folderId);
    }
    onFolderSelect(folderId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Période du rapport</CardTitle>
          <CardDescription>
            Définissez la période couverte par ce rapport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début</Label>
              <DatePicker
                id="start-date"
                date={reportMetadata.periodStart ? new Date(reportMetadata.periodStart) : undefined}
                setDate={(date) => handleStartDateChange(date)}
                placeholder="Date de début"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <DatePicker
                id="end-date"
                date={reportMetadata.periodEnd ? new Date(reportMetadata.periodEnd) : undefined}
                setDate={(date) => handleEndDateChange(date)}
                placeholder="Date de fin"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Sélection des dossiers</CardTitle>
          <CardDescription>
            Choisissez les dossiers contenant les documents source
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <FolderList 
              folders={folders}
              folderCounts={folderCounts}
              activeFolderId={activeFolderId}
              onFolderSelect={handleFolderSelection}
              onUploadClick={() => {}} // Placeholder, not used here
              onDeleteFolder={() => {}} // Placeholder, not used here
            />
          </ScrollArea>
        </CardContent>
      </Card>
      
      {activeFolderId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fichiers du dossier</span>
              {selectedFiles.length > 0 && (
                <Badge variant="secondary">
                  {selectedFiles.length} sélectionné(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <FolderFileList
                files={folderFiles}
                selectedFiles={selectedFiles}
                onFileSelect={onFileSelect}
              />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
