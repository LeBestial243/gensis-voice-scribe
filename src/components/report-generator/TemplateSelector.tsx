
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportTemplate, TemplateSection, ReportType } from "@/types/reports";

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  reportType?: string;
}

// Template list component
const TemplateList = ({ 
  templates,
  selectedTemplateId,
  onTemplateSelect 
}: { 
  templates: ReportTemplate[],
  selectedTemplateId: string,
  onTemplateSelect: (id: string) => void
}) => {
  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-3 pr-4">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          
          return (
            <Card 
              key={template.id} 
              className={cn(
                "transition-all duration-200 cursor-pointer",
                isSelected
                  ? "border-purple-500 bg-purple-50/50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
              )}
              onClick={() => onTemplateSelect(template.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={isSelected}
                    className="mt-1"
                    onCheckedChange={() => onTemplateSelect(template.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-sm truncate">{template.title}</span>
                      {template.report_type && (
                        <Badge variant="outline" className="ml-auto">
                          {getReportTypeLabel(template.report_type)}
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

// Template sections component
const TemplateSections = ({ 
  sections 
}: { 
  sections: TemplateSection[]
}) => {
  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Structure du template</CardTitle>
        <CardDescription className="text-xs">
          Sections qui seront incluses dans votre rapport
        </CardDescription>
      </CardHeader>
      <CardContent className="py-0 px-4 pb-3">
        <ScrollArea className="h-[150px]">
          <div className="space-y-2 pr-4">
            {sections.map((section, index) => (
              <div key={section.id} className="text-sm py-1 border-b last:border-b-0">
                <div className="font-medium">{index + 1}. {section.title}</div>
                {section.instructions && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {section.instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Empty state component
const NoTemplatesState = () => {
  return (
    <Card className="p-4">
      <div className="text-center text-gray-500 py-6">
        <File className="h-10 w-10 mx-auto mb-2 text-gray-400" />
        <p>Aucun modèle disponible</p>
        <p className="text-sm mt-1">Créez des modèles pour générer des rapports structurés</p>
      </div>
    </Card>
  );
};

// Loading state component
const LoadingState = () => {
  return (
    <Card className="p-4">
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    </Card>
  );
};

export function TemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect,
  reportType = "note"
}: TemplateSelectorProps) {
  // Fetch templates with the right report type
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['templates', reportType],
    queryFn: async () => {
      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by report type if specified
      if (reportType && reportType !== "note") {
        query = query.eq('report_type', reportType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as ReportTemplate[];
    },
  });

  // Fetch template sections for the selected template
  const { data: templateSections = [] } = useQuery({
    queryKey: ['template_sections', selectedTemplateId],
    queryFn: async () => {
      if (!selectedTemplateId) return [];
      
      const { data, error } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');
      
      if (error) throw error;
      return (data || []) as TemplateSection[];
    },
    enabled: !!selectedTemplateId,
  });

  if (isLoadingTemplates) {
    return <LoadingState />;
  }

  if (templates.length === 0) {
    return <NoTemplatesState />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">Modèles disponibles</h3>
        {selectedTemplateId && (
          <Badge variant="secondary">
            1 modèle sélectionné
          </Badge>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Sélectionnez un modèle pour structurer automatiquement votre rapport
      </p>
      <div className="space-y-3 pr-2">
        <TemplateList 
          templates={templates} 
          selectedTemplateId={selectedTemplateId} 
          onTemplateSelect={onTemplateSelect} 
        />
      </div>
      
      {selectedTemplateId && templateSections.length > 0 && (
        <TemplateSections sections={templateSections} />
      )}
    </div>
  );
}

// Helper function to get display label for report type
function getReportTypeLabel(type: string): string {
  switch (type) {
    case "activity":
      return "Rapport d'activité";
    case "standardized":
      return "Rapport standardisé";
    case "evaluation":
      return "Rapport d'évaluation";
    case "incident":
      return "Rapport d'incident";
    case "visit":
      return "Visite à domicile";
    case "interview":
      return "Entretien";
    case "note":
    default:
      return "Note de synthèse";
  }
}
