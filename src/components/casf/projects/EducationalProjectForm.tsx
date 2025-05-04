
import React from "react";
import { EducationalProject, ProjectStatus, ConfidentialityLevel } from "@/types/casf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccessLevelBadge } from "@/components/casf/confidentiality/AccessLevelBadge";
import { Loader2, Save } from "lucide-react";

interface EducationalProjectFormProps {
  project?: Partial<EducationalProject>;
  initialData?: Partial<EducationalProject>; // Add initialData prop
  onSubmit: (project: Partial<EducationalProject>) => void | Promise<any>;
  onChange: (project: Partial<EducationalProject>) => void;
  isSubmitting: boolean;
  profileId?: string; // Add profileId prop
  isLoading?: boolean; // Add isLoading prop
}

export function EducationalProjectForm({
  project,
  initialData,
  onSubmit,
  onChange,
  isSubmitting,
  profileId,
  isLoading
}: EducationalProjectFormProps) {
  // If initialData is provided, use it instead of project
  const projectData = initialData || project;
  
  const handleChange = (field: keyof EducationalProject, value: any) => {
    onChange({
      ...projectData,
      [field]: value
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(projectData || {});
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {projectData?.id ? "Modifier le projet éducatif" : "Nouveau projet éducatif"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du projet</Label>
            <Input
              id="title"
              value={projectData?.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Ex: Projet d'autonomisation et insertion sociale"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objectives">Objectifs généraux</Label>
            <Textarea
              id="objectives"
              value={projectData?.objectives || ""}
              onChange={(e) => handleChange("objectives", e.target.value)}
              placeholder="Décrivez les objectifs généraux de ce projet éducatif..."
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <DatePicker
                id="start_date"
                date={projectData?.start_date ? new Date(projectData.start_date) : new Date()}
                setDate={(date) => 
                  handleChange("start_date", date ? date.toISOString() : new Date().toISOString())
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin prévue</Label>
              <DatePicker
                id="end_date"
                date={projectData?.end_date ? new Date(projectData.end_date) : undefined}
                setDate={(date) => 
                  handleChange("end_date", date ? date.toISOString() : "")
                }
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut du projet</Label>
              <Select
                value={projectData?.status || "draft"}
                onValueChange={(value) => handleChange("status", value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="on_hold">En pause</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confidentiality">Niveau de confidentialité</Label>
              <Select
                value={projectData?.confidentiality_level || "restricted"}
                onValueChange={(value) => 
                  handleChange("confidentiality_level", value as ConfidentialityLevel)
                }
              >
                <SelectTrigger id="confidentiality">
                  <SelectValue placeholder="Choisir un niveau">
                    {projectData?.confidentiality_level && (
                      <div className="flex items-center gap-2">
                        <AccessLevelBadge level={projectData.confidentiality_level as any} />
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <AccessLevelBadge level="public" />
                      <span>Public - Tous les intervenants</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="restricted">
                    <div className="flex items-center gap-2">
                      <AccessLevelBadge level="restricted" />
                      <span>Restreint - Intervenants directs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="confidential">
                    <div className="flex items-center gap-2">
                      <AccessLevelBadge level="confidential" />
                      <span>Confidentiel - Référent uniquement</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="strict">
                    <div className="flex items-center gap-2">
                      <AccessLevelBadge level="strict" />
                      <span>Strict - Direction uniquement</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t mt-4">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting || isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {projectData?.id ? "Mettre à jour" : "Créer le projet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
