
import React from 'react';
import { TemplateSelector } from "../TemplateSelector";
import { SourceSelector } from "../SourceSelector";
import { ReportMetadata, StandardizedReportType } from '@/types/reports';

interface SelectionPanelProps {
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  profileId?: string;
  selectedFolders: string[];
  onFolderSelect: (id: string) => void;
  selectedFiles: string[];
  onFileSelect: (id: string) => void;
  reportMetadata: ReportMetadata;
  onMetadataChange: (metadata: ReportMetadata) => void;
  reportType: StandardizedReportType;
}

export function SelectionPanel({
  selectedTemplateId,
  setSelectedTemplateId,
  profileId,
  selectedFolders,
  onFolderSelect,
  selectedFiles,
  onFileSelect,
  reportMetadata,
  onMetadataChange,
  reportType
}: SelectionPanelProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
      <div className="space-y-4">
        <TemplateSelector
          selectedTemplateId={selectedTemplateId}
          onTemplateSelect={setSelectedTemplateId}
          reportType={reportType}
        />
      </div>
      <div className="space-y-4">
        {profileId && (
          <SourceSelector
            profileId={profileId}
            selectedFolders={selectedFolders}
            onFolderSelect={onFolderSelect}
            selectedFiles={selectedFiles}
            onFileSelect={onFileSelect}
            reportMetadata={reportMetadata}
            onMetadataChange={onMetadataChange}
            reportType={reportType}
          />
        )}
        {!profileId && (
          <div className="border border-dashed rounded-lg p-6 text-center">
            <p className="text-gray-500">
              Sélection de fichiers disponible uniquement pour les rapports liés à un profil
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
