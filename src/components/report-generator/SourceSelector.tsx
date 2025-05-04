
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Folder, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { useState } from "react";
import { ReportMetadata } from "@/types/reports";

interface SourceSelectorProps {
  profileId: string;
  selectedFolders: string[];
  onFolderSelect: (folderId: string) => void;
  selectedFiles: string[];
  onFileSelect: (fileId: string) => void;
  reportMetadata: ReportMetadata;
  onMetadataChange: (metadata: ReportMetadata) => void;
  reportType?: string;
}

export function SourceSelector({
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect,
  reportMetadata,
  onMetadataChange,
  reportType = "note"
}: SourceSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>("folders");
  
  // Fetch folders for this profile
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', profileId],
    queryFn: async () => {
      const { data, error } = await fetch(`/api/folders?profileId=${profileId}`).then(res => res.json());
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId
  });
  
  // Fetch files for selected folders or all files if no folders selected
  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ['files', profileId, selectedFolders],
    queryFn: async () => {
      const folderParams = selectedFolders.length > 0 
        ? `&folderIds=${selectedFolders.join(',')}`
        : '';
      
      const { data, error } = await fetch(`/api/files?profileId=${profileId}${folderParams}`).then(res => res.json());
      if (error) throw error;
      return data || [];
    },
    enabled: !!profileId
  });

  const handleDateChange = (key: keyof ReportMetadata, date: Date | undefined) => {
    if (date) {
      onMetadataChange({
        ...reportMetadata,
        [key]: format(date, 'yyyy-MM-dd')
      });
    }
  };

  const handleTypeChange = (type: string) => {
    onMetadataChange({
      ...reportMetadata,
      type
    });
  };

  // Define types based on the report type
  const getTypeOptions = () => {
    switch (reportType) {
      case "activity":
        return [
          { label: "Mensuel", value: "monthly" },
          { label: "Trimestriel", value: "quarterly" },
          { label: "Annuel", value: "yearly" },
          { label: "Personnalisé", value: "custom" }
        ];
      case "standardized":
        return [
          { label: "Admission", value: "admission" },
          { label: "Évaluation", value: "evaluation" },
          { label: "Périodique", value: "periodic" },
          { label: "Incident", value: "incident" },
          { label: "Personnalisé", value: "custom" }
        ];
      case "evaluation":
        return [
          { label: "Initiale", value: "initial" },
          { label: "Intermédiaire", value: "mid" },
          { label: "Finale", value: "final" }
        ];
      case "note":
      default:
        return [
          { label: "Observation", value: "observation" },
          { label: "Entretien", value: "interview" },
          { label: "Synthèse", value: "summary" },
          { label: "Général", value: "general" }
        ];
    }
  };

  const typeOptions = getTypeOptions();

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="report-type">Type de rapport</Label>
          <Select 
            value={reportMetadata.type || typeOptions[0].value} 
            onValueChange={handleTypeChange}
          >
            <SelectTrigger id="report-type">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="period-start">Date de début</Label>
            <DatePicker
              id="period-start"
              date={reportMetadata.periodStart ? new Date(reportMetadata.periodStart) : new Date()}
              setDate={(date) => handleDateChange('periodStart', date)}
              placeholder="Date de début"
            />
          </div>
          <div>
            <Label htmlFor="period-end">Date de fin</Label>
            <DatePicker
              id="period-end"
              date={reportMetadata.periodEnd ? new Date(reportMetadata.periodEnd) : new Date()}
              setDate={(date) => handleDateChange('periodEnd', date)}
              placeholder="Date de fin"
            />
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="folders">Dossiers</TabsTrigger>
          <TabsTrigger value="files">Fichiers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="folders">
          {foldersLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              <Folder className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>Aucun dossier disponible</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {folders.map((folder) => {
                const isSelected = selectedFolders.includes(folder.id);
                
                return (
                  <Card 
                    key={folder.id} 
                    className={`
                      transition-all duration-200 cursor-pointer border
                      ${isSelected 
                        ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => onFolderSelect(folder.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-gray-400" />
                          <span className="text-sm truncate">{folder.name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="files">
          {filesLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              <File className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              <p>Aucun fichier disponible</p>
              {selectedFolders.length > 0 && (
                <p className="text-sm mt-1">Aucun fichier dans les dossiers sélectionnés</p>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {files.map((file) => {
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
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => onFileSelect(file.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 text-gray-400" />
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        {file.type && (
                          <Badge variant="outline" className="ml-auto">
                            {file.type}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
