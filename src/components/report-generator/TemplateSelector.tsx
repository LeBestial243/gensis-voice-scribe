
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StandardizedReportType, ReportTemplate } from '@/types/reports';

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  reportType?: StandardizedReportType;
}

export function TemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect,
  reportType 
}: TemplateSelectorProps) {
  // Fetch templates 
  const { data: templates = [] } = useQuery({
    queryKey: ['templates', reportType],
    queryFn: async () => {
      let query = supabase.from('templates').select('*');
      
      // Filter by report type if specified
      if (reportType) {
        query = query.eq('type', reportType);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ReportTemplate[];
    },
  });

  // Fetch template sections for selected template
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
      return data;
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
              Structure de la note qui sera générée
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
