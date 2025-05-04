
import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface TabHeaderProps {
  activeTab: string;
  selectedFolders: string[];
  selectedFiles: string[];
  selectedTemplateId: string;
  isGenerating: boolean;
  generatedContent: string;
}

export function TabHeader({
  activeTab,
  selectedFolders,
  selectedFiles,
  selectedTemplateId,
  isGenerating,
  generatedContent
}: TabHeaderProps) {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="selection" disabled={isGenerating}>
        Sélection
        {(selectedFolders.length > 0 || selectedFiles.length > 0 || selectedTemplateId) && (
          <div className="flex gap-2 ml-2">
            {selectedFolders.length > 0 && (
              <Badge variant="secondary">
                {selectedFolders.length} dossier(s)
              </Badge>
            )}
            {selectedFiles.length > 0 && (
              <Badge variant="secondary">
                {selectedFiles.length} fichier(s)
              </Badge>
            )}
          </div>
        )}
      </TabsTrigger>
      <TabsTrigger value="editing" disabled={!generatedContent || isGenerating}>
        Édition
        <Sparkles className="ml-2 h-3 w-3" />
      </TabsTrigger>
    </TabsList>
  );
}
