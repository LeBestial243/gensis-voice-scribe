
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TemplateSelectorProps {
  selectedTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
}

export function TemplateSelector({ selectedTemplateId, onTemplateSelect }: TemplateSelectorProps) {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500 py-6">
          <File className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p>Aucun modèle disponible</p>
          <p className="text-sm mt-1">Créez des modèles pour générer des notes structurées</p>
        </div>
      </Card>
    );
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
        Sélectionnez un modèle pour structurer automatiquement votre note
      </p>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          
          return (
            <Card 
              key={template.id} 
              className={`
                transition-all duration-200 cursor-pointer border
                ${isSelected 
                  ? 'border-purple-500 bg-purple-50/50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }
              `}
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
    </div>
  );
}
