
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Save } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { ReportMetadata, ReportResourceType } from "@/types/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportEditorProps {
  reportTitle: string;
  onTitleChange: (title: string) => void;
  generatedContent: string;
  onContentChange: (content: string) => void;
  reportData: any;
  onReportDataChange: (data: any) => void;
  reportMetadata: ReportMetadata;
  onMetadataChange: (metadata: ReportMetadata) => void;
  reportType: ReportResourceType;
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
  reportType,
}: ReportEditorProps) {
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
  
  const handleInstitutionChange = (institution: string) => {
    onMetadataChange({
      ...reportMetadata,
      institution
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Métadonnées du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="report-title">Titre du rapport</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full"
                placeholder="Entrez un titre pour le rapport"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={reportMetadata.institution || ""}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                className="w-full"
                placeholder="Nom de l'institution"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Date de début</Label>
              <DatePicker
                id="start-date"
                date={reportMetadata.periodStart ? new Date(reportMetadata.periodStart) : undefined}
                setDate={handleStartDateChange}
                placeholder="Date de début"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Date de fin</Label>
              <DatePicker
                id="end-date"
                date={reportMetadata.periodEnd ? new Date(reportMetadata.periodEnd) : undefined}
                setDate={handleEndDateChange}
                placeholder="Date de fin"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contenu du rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="relative">
              <Textarea
                id="generated-content"
                value={generatedContent}
                onChange={(e) => onContentChange(e.target.value)}
                className="min-h-[400px] text-base p-4 rounded-lg font-mono"
                placeholder="Le contenu généré apparaîtra ici. Vous pourrez le modifier avant de sauvegarder."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
