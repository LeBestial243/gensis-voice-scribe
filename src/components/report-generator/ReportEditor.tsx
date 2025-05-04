
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportMetadata } from "@/types/reports";

interface ReportEditorProps {
  reportTitle: string;
  onTitleChange: (title: string) => void;
  generatedContent: string;
  onContentChange: (content: string) => void;
  reportData: any;
  onReportDataChange: (data: any) => void;
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
  reportType = "note"
}: ReportEditorProps) {
  const handleDateChange = (key: keyof ReportMetadata, date: Date | undefined) => {
    if (date) {
      onMetadataChange({
        ...reportMetadata,
        [key]: date.toISOString().split('T')[0]
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
    <div className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="report-title" className="text-base font-medium">Titre du rapport</Label>
        <input
          id="report-title"
          value={reportTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-base shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Entrez un titre pour le rapport"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="editor-report-type">Type de rapport</Label>
          <Select 
            value={reportMetadata.type || typeOptions[0].value} 
            onValueChange={handleTypeChange}
          >
            <SelectTrigger id="editor-report-type">
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
        
        <div>
          <Label htmlFor="editor-period-start">Date de début</Label>
          <DatePicker
            id="editor-period-start"
            date={reportMetadata.periodStart ? new Date(reportMetadata.periodStart) : new Date()}
            setDate={(date) => handleDateChange('periodStart', date)}
            placeholder="Date de début"
          />
        </div>
        
        <div>
          <Label htmlFor="editor-period-end">Date de fin</Label>
          <DatePicker
            id="editor-period-end"
            date={reportMetadata.periodEnd ? new Date(reportMetadata.periodEnd) : new Date()}
            setDate={(date) => handleDateChange('periodEnd', date)}
            placeholder="Date de fin"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="generated-content" className="text-base font-medium">Contenu du rapport</Label>
        <div className="relative">
          <Textarea
            id="generated-content"
            value={generatedContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="min-h-[400px] text-base p-4 rounded-lg resize-y"
            placeholder="Le contenu généré apparaîtra ici. Vous pourrez le modifier avant de sauvegarder."
          />
        </div>
      </div>
    </div>
  );
}
