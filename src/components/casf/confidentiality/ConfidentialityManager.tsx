import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { confidentialityService } from "@/services/confidentialityService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Shield, Lock, UserCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ConfidentialityLevel, confidentialityLevels } from "@/types/confidentiality";
import { AccessLevelBadge } from "./AccessLevelBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function ConfidentialityManager() {
  const [settings, setSettings] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("defaults");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await confidentialityService.getDefaultSettings();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load confidentiality settings:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres de confidentialité",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [toast]);
  
  const updateDefaultLevel = async (resourceType: string, level: ConfidentialityLevel) => {
    try {
      // Mise à jour locale de l'état
      setSettings(prev => ({
        ...prev,
        defaultLevels: {
          ...prev.defaultLevels,
          [resourceType]: level
        }
      }));
      
      toast({
        title: "Succès",
        description: `Niveau par défaut pour ${resourceType} mis à jour`,
      });
      
      // Dans une implémentation réelle, vous appelleriez ici votre API pour persister les changements
    } catch (error) {
      console.error("Failed to update default level:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le niveau par défaut",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de confidentialité</CardTitle>
          <CardDescription>Chargement en cours...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paramètres de confidentialité</CardTitle>
          <CardDescription>Impossible de charger les paramètres</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Paramètres de confidentialité</CardTitle>
            <CardDescription>Configuration des niveaux d'accès aux données sensibles</CardDescription>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="defaults" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Niveaux par défaut</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>Permissions par rôle</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="defaults" className="mt-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Niveaux de confidentialité par défaut</h3>
              <p className="text-muted-foreground text-sm">
                Définissez le niveau de confidentialité par défaut pour chaque type de ressource
              </p>
              
              <Separator className="my-4" />
              
              <div className="grid gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Transcriptions</h4>
                  <ResourceConfidentialitySelector
                    value={settings.defaultLevels.transcriptions}
                    onChange={(value) => updateDefaultLevel('transcriptions', value as ConfidentialityLevel)}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <ResourceConfidentialitySelector
                    value={settings.defaultLevels.notes}
                    onChange={(value) => updateDefaultLevel('notes', value as ConfidentialityLevel)}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Projets</h4>
                  <ResourceConfidentialitySelector
                    value={settings.defaultLevels.projects}
                    onChange={(value) => updateDefaultLevel('projects', value as ConfidentialityLevel)}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Rapports</h4>
                  <ResourceConfidentialitySelector
                    value={settings.defaultLevels.reports}
                    onChange={(value) => updateDefaultLevel('reports', value as ConfidentialityLevel)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="roles" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Permissions par rôle</h3>
              <p className="text-muted-foreground text-sm">
                Configurez quels rôles peuvent accéder à chaque niveau de confidentialité
              </p>
              
              <Separator className="my-4" />
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rôle</th>
                      {Object.entries(confidentialityLevels).map(([level, { label, color }]) => (
                        <th key={level} className="p-2">
                          <div className="flex flex-col items-center">
                            <span className={`w-3 h-3 rounded-full ${color} mb-1`}></span>
                            <span>{label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(settings.roleAccess).map(([role, levels]) => (
                      <tr key={role} className="border-b">
                        <td className="p-2 font-medium capitalize">{role}</td>
                        {Object.entries(confidentialityLevels).map(([levelKey]) => {
                          const access = (levels as any)[levelKey as ConfidentialityLevel];
                          let badgeColor = "bg-gray-200 text-gray-700";
                          
                          if (access === 'read') {
                            badgeColor = "bg-blue-100 text-blue-800";
                          } else if (access === 'write') {
                            badgeColor = "bg-green-100 text-green-800";
                          } else {
                            badgeColor = "bg-red-100 text-red-800";
                          }
                          
                          return (
                            <td key={levelKey} className="p-2 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                                {access === 'write' ? 'Écriture' : access === 'read' ? 'Lecture' : 'Aucun'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Pour modifier les permissions des rôles, veuillez contacter l'administrateur système.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          Enregistrer les modifications
        </Button>
      </CardFooter>
    </Card>
  );
}

interface ResourceConfidentialitySelectorProps {
  value: ConfidentialityLevel;
  onChange: (value: string) => void;
  showDescription?: boolean;
}

export function ResourceConfidentialitySelector({ 
  value, 
  onChange,
  showDescription = true 
}: ResourceConfidentialitySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="confidentiality">Niveau de confidentialité</Label>
        <AccessLevelBadge level={value} />
      </div>
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="confidentiality" className="w-full">
          <SelectValue placeholder="Sélectionner un niveau" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(confidentialityLevels).map(([key, { label, description, color }]) => (
            <SelectItem key={key} value={key} className="flex items-center py-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span>{label}</span>
                </div>
                {showDescription && (
                  <span className="text-xs text-muted-foreground mt-1">{description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
