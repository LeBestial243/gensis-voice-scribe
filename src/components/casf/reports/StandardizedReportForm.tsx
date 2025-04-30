import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StandardizedReport, ReportTemplate } from '@/types/casf';
import { ConfidentialityLevel } from '@/types/confidentiality';
import { Loader2, Plus, Trash } from 'lucide-react';

interface StandardizedReportFormProps {
  initialData?: Partial<StandardizedReport>;
  templates?: ReportTemplate[];
  profileId: string;
  onSubmit: (data: Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>) => Promise<StandardizedReport>;
  isLoading: boolean;
}

export function StandardizedReportForm({
  initialData,
  templates = [],
  profileId,
  onSubmit,
  isLoading
}: StandardizedReportFormProps) {
  const [formData, setFormData] = useState<Partial<StandardizedReport>>(
    initialData || {
      title: '',
      report_type: 'evaluation',
      content: {},
      profile_id: profileId,
      confidentiality_level: 'restricted' as ConfidentialityLevel,
      created_by: 'current-user' // This should be replaced with actual user ID
    }
  );
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sections, setSections] = useState<{ title: string; content: string }[]>(() => {
    const content = formData.content || {};
    if (typeof content === 'object' && 'sections' in content) {
      return Array.isArray(content.sections) ? content.sections : [{ title: 'Section 1', content: '' }];
    }
    return [{ title: 'Section 1', content: '' }];
  });
  
  const handleInputChange = (field: keyof StandardizedReport, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Find the selected template
    const template = templates.find(t => t.id === templateId);
    if (template && template.sections) {
      // Convert template sections to form sections
      const newSections = template.sections.map(section => ({
        title: section.title,
        content: ''
      }));
      
      setSections(newSections);
      setFormData(prev => ({
        ...prev,
        title: template.title
      }));
    }
  };
  
  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setSections(updatedSections);
  };
  
  const handleAddSection = () => {
    setSections([...sections, { title: `Section ${sections.length + 1}`, content: '' }]);
  };
  
  const handleRemoveSection = (index: number) => {
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine form data with sections
    const reportData: Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'> = {
      ...formData as Omit<StandardizedReport, 'id' | 'created_at' | 'updated_at'>,
      content: {
        sections,
        template_id: selectedTemplate || null
      }
    };
    
    await onSubmit(reportData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Titre du rapport</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={e => handleInputChange('title', e.target.value)}
                placeholder="Titre du rapport"
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
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="evaluation">Évaluation</SelectItem>
                  <SelectItem value="periodic">Périodique</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="template">Modèle de rapport</Label>
            <Select
              value={selectedTemplate}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Sélectionner un modèle (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun modèle</SelectItem>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="confidentiality">Niveau de confidentialité</Label>
            <Select
              value={formData.confidentiality_level}
              onValueChange={value => handleInputChange('confidentiality_level', value)}
            >
              <SelectTrigger id="confidentiality">
                <SelectValue placeholder="Sélectionner un niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="restricted">Restreint</SelectItem>
                <SelectItem value="confidential">Confidentiel</SelectItem>
                <SelectItem value="strict">Strictement confidentiel</SelectItem>
              </SelectContent>
            </Select>
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
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex-1">
                  <Input
                    value={section.title}
                    onChange={e => handleSectionChange(index, 'title', e.target.value)}
                    placeholder="Titre de la section"
                    className="font-medium"
                  />
                </div>
                {sections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSection(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Textarea
                  value={section.content}
                  onChange={e => handleSectionChange(index, 'content', e.target.value)}
                  placeholder="Contenu de la section..."
                  className="min-h-[150px]"
                />
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
