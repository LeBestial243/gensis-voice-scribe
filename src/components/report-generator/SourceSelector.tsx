
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StandardizedReportType, ReportMetadata } from '@/types/reports';

interface SourceSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  reportMetadata?: ReportMetadata;
  onMetadataChange?: (metadata: ReportMetadata) => void;
  reportType?: StandardizedReportType;
}

export function SourceSelector({
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect,
  reportMetadata = {},
  onMetadataChange = () => {},
  reportType
}: SourceSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch folders for this profile
  const { data: folders = [] } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch files for selected folders
  const { data: files = [] } = useQuery({
    queryKey: ['files', selectedFolders],
    queryFn: async () => {
      if (selectedFolders.length === 0) return [];
      
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .in('folder_id', selectedFolders);
      
      if (error) throw error;
      return data;
    },
    enabled: selectedFolders.length > 0,
  });

  // Filter files based on search term
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update metadata field handler
  const handleMetadataChange = (key: string, value: any) => {
    onMetadataChange({
      ...reportMetadata,
      [key]: value
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dossiers</CardTitle>
          <CardDescription>
            Sélectionnez les dossiers contenant les documents à analyser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2">
              {folders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun dossier disponible</p>
              ) : (
                folders.map(folder => (
                  <div key={folder.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`folder-${folder.id}`}
                      checked={selectedFolders.includes(folder.id)}
                      onCheckedChange={() => onFolderSelect(folder.id)}
                    />
                    <Label 
                      htmlFor={`folder-${folder.id}`}
                      className="cursor-pointer"
                    >
                      {folder.title}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedFolders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fichiers</CardTitle>
            <CardDescription>
              Sélectionnez les fichiers spécifiques à inclure
            </CardDescription>
            <Input
              placeholder="Rechercher des fichiers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {filteredFiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "Aucun fichier correspondant" : "Aucun fichier dans les dossiers sélectionnés"}
                  </p>
                ) : (
                  filteredFiles.map(file => (
                    <div key={file.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`file-${file.id}`}
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => onFileSelect(file.id)}
                      />
                      <Label 
                        htmlFor={`file-${file.id}`}
                        className="cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <span>{file.name}</span>
                        <Badge variant="outline">{file.type}</Badge>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Metadata fields */}
      <Card>
        <CardHeader>
          <CardTitle>Métadonnées</CardTitle>
          <CardDescription>
            Informations supplémentaires pour le rapport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period-start">Date de début</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={reportMetadata.period_start ? new Date(reportMetadata.period_start).toISOString().split('T')[0] : ''}
                  onChange={e => handleMetadataChange('period_start', new Date(e.target.value).toISOString())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">Date de fin</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={reportMetadata.period_end ? new Date(reportMetadata.period_end).toISOString().split('T')[0] : ''}
                  onChange={e => handleMetadataChange('period_end', new Date(e.target.value).toISOString())}
                />
              </div>
            </div>
            
            {/* Additional metadata fields specific to report types */}
            {reportType === 'activity' && (
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={reportMetadata.category || ''}
                  onChange={e => handleMetadataChange('category', e.target.value)}
                  placeholder="Catégorie du rapport"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
