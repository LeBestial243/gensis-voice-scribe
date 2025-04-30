
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleAccess } from "@/types/casf";
import { confidentialityLevels, ConfidentialityLevel } from "@/types/confidentiality";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RoleAccessEditorProps {
  roleAccess: RoleAccess[];
  onChange: (roleAccess: RoleAccess[]) => void;
}

export function RoleAccessEditor({ roleAccess, onChange }: RoleAccessEditorProps) {
  const handleAccessChange = (
    roleIndex: number,
    resourceType: string,
    newValue: 'none' | 'read' | 'write'
  ) => {
    const updatedRoleAccess = [...roleAccess];
    updatedRoleAccess[roleIndex] = {
      ...updatedRoleAccess[roleIndex],
      resources: {
        ...updatedRoleAccess[roleIndex].resources,
        [resourceType]: newValue
      }
    };
    onChange(updatedRoleAccess);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50/50 border-amber-100">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Gestion des accès sensible</AlertTitle>
        <AlertDescription className="text-amber-700">
          La modification des niveaux d'accès par rôle peut avoir un impact important sur la confidentialité des données.
          Assurez-vous de respecter le principe du moindre privilège.
        </AlertDescription>
      </Alert>
      
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            <span>Matrice des permissions par rôle</span>
          </CardTitle>
          <CardDescription>
            Définissez quelles actions chaque rôle peut effectuer sur les contenus selon leur niveau de confidentialité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">Rôle</TableHead>
                {Object.entries(confidentialityLevels).map(([level, { label, color }]) => (
                  <TableHead key={level} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`w-3 h-3 rounded-full ${color}`}></span>
                      <span>{label}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roleAccess.map((role, roleIndex) => (
                <TableRow key={role.role}>
                  <TableCell className="font-medium capitalize">{role.role}</TableCell>
                  {Object.keys(confidentialityLevels).map((level) => (
                    <TableCell key={`${role.role}-${level}`} className="text-center">
                      <Select
                        value={role.resources[level as ConfidentialityLevel] || 'none'}
                        onValueChange={(value) => handleAccessChange(
                          roleIndex,
                          level as string,
                          value as 'none' | 'read' | 'write'
                        )}
                      >
                        <SelectTrigger className="w-28 mx-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          <SelectItem value="read">Lecture</SelectItem>
                          <SelectItem value="write">Écriture</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Légende :</strong> Aucun = aucun accès, Lecture = accès en lecture seulement, Écriture = accès complet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
