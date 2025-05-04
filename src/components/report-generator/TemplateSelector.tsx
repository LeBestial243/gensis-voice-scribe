
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReportResourceType } from "@/types/reports";

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  reportType?: ReportResourceType;
}

export function TemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect,
  reportType
}: TemplateSelectorProps) {
  const { data: templates = [] } = useQuery({
    queryKey: ['templates', reportType],
    queryFn: async () => {
      let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by report type if specified
      if (reportType) {
        query = query.eq('report_type', reportType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: templateSections = [] } = useQuery({
    queryKey: ['template_sections', selectedTemplateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_sections')
        .select('*')
        .eq('template_id', selectedTemplateId)
        .order('order_index');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTemplateId,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Sélectionner un template</Label>
        <Select value={selectedTemplateId} onValueChange={onTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir un template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplateId && templateSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aperçu des sections</CardTitle>
            <CardDescription>
              Structure du rapport qui sera généré
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-4">
                {templateSections.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <h4 className="font-medium">{section.title}</h4>
                    {section.instructions && (
                      <p className="text-sm text-muted-foreground">
                        {section.instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
