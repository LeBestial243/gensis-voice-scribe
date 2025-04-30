
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResourceConfidentialitySelector } from './ResourceConfidentialitySelector';
import { useConfidentiality } from '@/hooks/useConfidentiality';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Shield, Lock, UserCheck } from 'lucide-react';
import { confidentialityLevels, ConfidentialityLevel } from '@/types/confidentiality';
import { useToast } from '@/hooks/use-toast';

export function ConfidentialitySettings() {
  // Use current user ID if available, or pass an admin ID for demo
  const [userId] = useState<string>("current-user-id");
  const { 
    settings,
    userRole,
    isLoading,
    updateDefaultLevel,
    canAccess
  } = useConfidentiality(userId);

  const { toast } = useToast();

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

  if (!settings) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Paramètres de confidentialité</CardTitle>
          <CardDescription>Impossible de charger les paramètres</CardDescription>
        </CardHeader>
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
                {Object.entries(settings.defaultLevels).map(([resourceType, level]) => (
                  <div key={resourceType}>
                    <h4 className="text-sm font-medium mb-2 capitalize">{resourceType}</h4>
                    <ResourceConfidentialitySelector
                      value={level}
                      onChange={(value) => updateDefaultLevel(resourceType, value as ConfidentialityLevel)}
                    />
                  </div>
                ))}
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
                    {settings.roleAccess.map((roleAccess) => (
                      <tr key={roleAccess.role} className="border-b">
                        <td className="p-2 font-medium capitalize">{roleAccess.role}</td>
                        {Object.entries(confidentialityLevels).map(([levelKey]) => {
                          const access = roleAccess.resources[levelKey];
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
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => {
            toast({
              title: "Paramètres enregistrés",
              description: "Les paramètres de confidentialité ont été sauvegardés."
            });
          }}
        >
          Enregistrer les modifications
        </Button>
      </CardFooter>
    </Card>
  );
}
