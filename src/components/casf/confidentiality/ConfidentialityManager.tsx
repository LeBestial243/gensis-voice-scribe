
import React, { useState, useEffect } from "react";
import { useConfidentiality } from "@/hooks/useConfidentiality";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Shield, AlertCircle } from "lucide-react";
import { AuditLogViewer } from "./AuditLogViewer";
import { RoleAccessEditor } from "./RoleAccessEditor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfidentialitySettings } from "@/types/casf";

// Main confidentiality management component
export function ConfidentialityManager() {
  const [userId] = useState<string>("current-user-id"); // In a real app, get this from auth context
  const [activeTab, setActiveTab] = useState("settings");
  
  const {
    settings,
    isLoadingSettings,
    isUpdatingSettings,
    updateSettings,
  } = useConfidentiality(userId);
  
  // Local state for editing settings
  const [editedSettings, setEditedSettings] = useState<ConfidentialitySettings | undefined>(settings);
  
  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setEditedSettings(settings);
    }
  }, [settings]);
  
  if (isLoadingSettings) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const handleSaveSettings = () => {
    if (editedSettings) {
      updateSettings(editedSettings);
    }
  };
  
  if (!editedSettings) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="ml-2">Impossible de charger les paramètres de confidentialité.</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span>Gestion de la confidentialité (CASF 2025)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="settings">Paramètres généraux</TabsTrigger>
            <TabsTrigger value="access">Niveaux d'accès</TabsTrigger>
            <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <div className="space-y-6">
              <Alert className="bg-blue-50/50 border-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Conformité CASF 2025</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Les paramètres de confidentialité vous permettent de respecter les obligations du Code de l'Action Sociale et des Familles, notamment concernant le secret professionnel et la transmission des informations.
                </AlertDescription>
              </Alert>
              
              <h3 className="font-medium text-lg">Niveaux de confidentialité par défaut</h3>
              <p className="text-sm text-gray-500 mb-4">Définissez les niveaux d'accès par défaut pour chaque type de contenu.</p>
              
              {/* Default levels table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type de contenu</TableHead>
                    <TableHead>Niveau de confidentialité</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(editedSettings.defaultLevels).map(([resourceType, level]) => (
                    <TableRow key={resourceType}>
                      <TableCell className="font-medium">
                        {resourceTypeToLabel(resourceType)}
                      </TableCell>
                      <TableCell>
                        <select 
                          className="p-2 border rounded-md w-full"
                          value={level}
                          onChange={(e) => {
                            setEditedSettings({
                              ...editedSettings,
                              defaultLevels: {
                                ...editedSettings.defaultLevels,
                                [resourceType]: e.target.value as any
                              }
                            });
                          }}
                        >
                          <option value="public">Public - Tous les intervenants</option>
                          <option value="restricted">Restreint - Intervenants directs</option>
                          <option value="confidential">Confidentiel - Référent uniquement</option>
                          <option value="strict">Strict - Direction uniquement</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {getConfidentialityLevelDescription(level)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <h3 className="font-medium text-lg mt-6">Options de transmission</h3>
              <p className="text-sm text-gray-500 mb-4">Configurez les règles de partage et transmission des informations.</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Demander confirmation avant export</h4>
                    <p className="text-sm text-gray-500">Ajouter une étape de vérification avant l'export de documents</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Anonymisation automatique</h4>
                    <p className="text-sm text-gray-500">Anonymiser les informations sensibles dans les rapports partagés</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Journal de transmission</h4>
                    <p className="text-sm text-gray-500">Enregistrer toutes les actions de partage et d'export</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="flex justify-end pt-4 mt-4 border-t">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={isUpdatingSettings}
                >
                  {isUpdatingSettings ? "Enregistrement..." : "Enregistrer les paramètres"}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="access">
            <RoleAccessEditor 
              roleAccess={editedSettings.roleAccess}
              onChange={(newRoleAccess) => {
                setEditedSettings({
                  ...editedSettings,
                  roleAccess: newRoleAccess
                });
              }}
            />
            
            <div className="flex justify-end pt-4 mt-4 border-t">
              <Button 
                onClick={handleSaveSettings}
                disabled={isUpdatingSettings}
              >
                {isUpdatingSettings ? "Enregistrement..." : "Enregistrer les paramètres d'accès"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="audit">
            <AuditLogViewer userId={userId} maxItems={10} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Utility functions
function resourceTypeToLabel(resourceType: string): string {
  const labels: Record<string, string> = {
    'files': 'Fichiers',
    'notes': 'Notes',
    'templates': 'Templates',
    'educational_projects': 'Projets éducatifs',
    'activity_reports': 'Rapports d\'activité'
  };
  
  return labels[resourceType] || resourceType;
}

function getConfidentialityLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    'public': 'Accessible à tous les intervenants',
    'restricted': 'Accessible aux intervenants directs et superviseurs',
    'confidential': 'Accessible uniquement aux intervenants autorisés',
    'strict': 'Accessible uniquement au référent et à la direction'
  };
  
  return descriptions[level] || level;
}
