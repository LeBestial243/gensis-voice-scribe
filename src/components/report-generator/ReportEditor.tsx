
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ReportMetadata } from '@/types/reports';

interface ReportEditorProps {
  reportTitle: string;
  onTitleChange: (title: string) => void;
  generatedContent: string;
  onContentChange: (content: string) => void;
  reportData: Record<string, any>;
  onReportDataChange: (data: Record<string, any>) => void;
  reportMetadata: ReportMetadata;
  onMetadataChange: (metadata: ReportMetadata) => void;
  reportType?: string;
}

export function ReportEditor({
  reportTitle,
  onTitleChange,
  generatedContent,
  onContentChange,
  reportData,
  onReportDataChange,
  reportMetadata,
  onMetadataChange,
  reportType
}: ReportEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="report-title">Titre du rapport</Label>
        <Input
          id="report-title"
          value={reportTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-medium"
          placeholder="Titre du rapport"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="report-content">Contenu</Label>
          <span className="text-xs text-muted-foreground">
            {generatedContent.length} caractères
          </span>
        </div>
        <Textarea
          id="report-content"
          value={generatedContent}
          onChange={(e) => onContentChange(e.target.value)}
          className="min-h-[400px] font-mono"
          placeholder="Contenu du rapport"
        />
      </div>

      {/* Additional section fields if needed based on report type */}
      {reportType === 'activity' && reportData.sections && (
        <div className="space-y-4">
          <Label>Sections</Label>
          {reportData.sections.map((section: any, index: number) => (
            <div key={index} className="space-y-2 border p-4 rounded-lg">
              <Input
                value={section.title}
                onChange={(e) => {
                  const newSections = [...reportData.sections];
                  newSections[index].title = e.target.value;
                  onReportDataChange({
                    ...reportData,
                    sections: newSections
                  });
                }}
                placeholder="Titre de la section"
              />
              <Textarea
                value={section.content}
                onChange={(e) => {
                  const newSections = [...reportData.sections];
                  newSections[index].content = e.target.value;
                  onReportDataChange({
                    ...reportData,
                    sections: newSections
                  });
                }}
                placeholder="Contenu de la section"
                className="min-h-[100px]"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
