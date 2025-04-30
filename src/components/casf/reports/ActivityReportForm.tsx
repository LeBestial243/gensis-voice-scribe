import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ActivityReport } from '@/types/casf';
import { Loader2, Plus, Trash, Calendar as CalendarIcon } from 'lucide-react';

interface ActivityReportFormProps {
  initialData?: Partial<ActivityReport>;
  onSubmit: (data: Omit<ActivityReport, 'id' | 'created_at'>) => Promise<ActivityReport>;
  isLoading: boolean;
}

export function ActivityReportForm({
  initialData,
  onSubmit,
  isLoading
}: ActivityReportFormProps) {
  const [formData, setFormData] = useState<Partial<ActivityReport>>(
    initialData || {
      title: '',
      report_type: 'monthly',
      period_start: new Date().toISOString(),
      period_end: new Date().toISOString(),
      content: {
        sections: [{ title: 'Résumé', content: '' }],
        metrics: []
      },
      user_id: 'current-user' // This should be replaced with actual user ID
    }
  );
  
  const [sections, setSections] = useState<{ title: string; content: string }[]>(() => {
    const content = formData.content || {};
    if (typeof content === 'object' && 'sections' in content) {
      return Array.isArray(content.sections) ? content.sections : [{ title: 'Résumé', content: '' }];
    }
    return [{ title: 'Résumé', content: '' }];
  });
  
  const [metrics, setMetrics] = useState<{ name: string; value: number; unit: string }[]>(() => {
    const content = formData.content || {};
    if (typeof content === 'object' && 'metrics' in content) {
      return Array.isArray(content.metrics) ? content.metrics : [];
    }
    return [];
  });
  
  const handleInputChange = (field: keyof ActivityReport, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setSections(updatedSections);
  };
  
  const handleMetricChange = (index: number, field: 'name' | 'value' | 'unit', value: string | number) => {
    const updatedMetrics = [...metrics];
    updatedMetrics[index] = {
      ...updatedMetrics[index],
      [field]: value
    };
    setMetrics(updatedMetrics);
  };
  
  const handleAddSection = () => {
    setSections([...sections, { title: `Section ${sections.length + 1}`, content: '' }]);
  };
  
  const handleRemoveSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
  };
  
  const handleAddMetric = () => {
    setMetrics([...metrics, { name: '', value: 0, unit: '' }]);
  };
  
  const handleRemoveMetric = (index: number) => {
    const updatedMetrics = metrics.filter((_, i) => i !== index);
    setMetrics(updatedMetrics);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine form data with sections and metrics
    const reportData: Omit<ActivityReport, 'id' | 'created_at'> = {
      ...formData as Omit<ActivityReport, 'id' | 'created_at'>,
      content: {
        sections,
        metrics
      }
    };
    
    await onSubmit(reportData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titre du rapport</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="Titre du rapport d'activité"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="report_type">Type de rapport</Label>
            <Select
              value={formData.report_type}
              onValueChange={value => handleInputChange('report_type', value)}
            >
              <SelectTrigger id="report_type">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="quarterly">Trimestriel</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
                <SelectItem value="custom">Personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="period_start">Début de période</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_start ? (
                      format(new Date(formData.period_start), 'P', { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.period_start ? new Date(formData.period_start) : undefined}
                    onSelect={(date) => date && handleInputChange('period_start', date.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="period_end">Fin de période</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.period_end ? (
                      format(new Date(formData.period_end), 'P', { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.period_end ? new Date(formData.period_end) : undefined}
                    onSelect={(date) => date && handleInputChange('period_end', date.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Sections du rapport</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSection}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Ajouter une section
            </Button>
          </div>
          
          {sections.map((section, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={section.title}
                      onChange={e => handleSectionChange(index, 'title', e.target.value)}
                      placeholder="Titre de la section"
                      className="font-medium"
                    />
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSection(index)}
                        className="ml-2"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={section.content}
                    onChange={e => handleSectionChange(index, 'content', e.target.value)}
                    placeholder="Contenu de la section..."
                    className="min-h-[150px]"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Métriques</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMetric}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Ajouter une métrique
            </Button>
          </div>
          
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`metric-name-${index}`}>Nom</Label>
                    <Input
                      id={`metric-name-${index}`}
                      value={metric.name}
                      onChange={e => handleMetricChange(index, 'name', e.target.value)}
                      placeholder="Nom de la métrique"
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`metric-value-${index}`}>Valeur</Label>
                    <Input
                      id={`metric-value-${index}`}
                      type="number"
                      value={metric.value}
                      onChange={e => handleMetricChange(index, 'value', Number(e.target.value))}
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`metric-unit-${index}`}>Unité</Label>
                    <Input
                      id={`metric-unit-${index}`}
                      value={metric.unit}
                      onChange={e => handleMetricChange(index, 'unit', e.target.value)}
                      placeholder="Unité"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMetric(index)}
                      className="mb-0.5"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer le rapport'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
