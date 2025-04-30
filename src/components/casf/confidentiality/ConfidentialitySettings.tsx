
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfidentialityManager } from './ConfidentialityManager';
import { useConfidentiality } from '@/hooks/useConfidentiality';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Shield, Lock, UserCheck } from 'lucide-react';
import { confidentialityLevels, ConfidentialityLevel } from '@/types/confidentiality';

export function ConfidentialitySettings() {
  const { 
    settings,
    userRole,
    isLoading,
    updateDefaultLevel,
    canAccess
  } = useConfidentiality();

  // Check if the user has admin access
  const isAdmin = userRole === 'admin';

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Paramètres de confidentialité</CardTitle>
          <CardDescription>Chargement des paramètres...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // If not admin, show limited view
  if (!isAdmin) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Paramètres de confidentialité</CardTitle>
          <CardDescription>Configuration des niveaux d'accès aux données sensibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-muted-foreground">
              Vous devez avoir des droits administrateur pour gérer les paramètres de confidentialité.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Paramètres de confidentialité</CardTitle>
            <CardDescription>Configuration des niveaux d'accès aux données sensibles</CardDescription>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="defaults">
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
                  <ConfidentialityManager 
                    value={settings.defaultLevels.transcriptions}
                    onChange={(value) => updateDefaultLevel('transcriptions', value as ConfidentialityLevel)}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <ConfidentialityManager 
                    value={settings.defaultLevels.notes}
                    onChange={(value) => updateDefaultLevel('notes', value as ConfidentialityLevel)}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Projets</h4>
                  <ConfidentialityManager 
                    value={settings.defaultLevels.projects}
                    onChange={(value) => updateDefaultLevel('projects', value as ConfidentialityLevel)}
                  />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Rapports</h4>
                  <ConfidentialityManager 
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
                          const access = levels[levelKey as ConfidentialityLevel];
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
