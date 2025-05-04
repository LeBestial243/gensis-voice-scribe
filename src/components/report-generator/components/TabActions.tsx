
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Download, Save } from "lucide-react";
import { ReportMetadata } from '@/types/reports';
import { UseMutationResult } from '@tanstack/react-query';

interface SelectionActionsProps {
  onClose: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isDisabled: boolean;
  selectedFilesCount: number;
  hasSelectedTemplate: boolean;
}

export function SelectionActions({
  onClose,
  onGenerate,
  isGenerating,
  isDisabled,
  selectedFilesCount,
  hasSelectedTemplate
}: SelectionActionsProps) {
  return (
    <>
      <Button variant="outline" onClick={onClose}>
        Annuler
      </Button>
      <Button 
        onClick={onGenerate} 
        disabled={isDisabled || isGenerating}
        className="bg-gradient-to-r from-purple-500 to-indigo-600"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            Générer avec IA
            {(selectedFilesCount > 0 || hasSelectedTemplate) && (
              <Badge variant="outline" className="ml-2 bg-white text-purple-600">
                {selectedFilesCount > 0 
                  ? `${selectedFilesCount} fichier(s)` 
                  : "Template"}
              </Badge>
            )}
          </>
        )}
      </Button>
    </>
  );
}

interface EditingActionsProps {
  onReset: () => void;
  onCopy: () => void;
  onExport: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function EditingActions({
  onReset,
  onCopy,
  onExport,
  onSave,
  isSaving
}: EditingActionsProps) {
  return (
    <>
      <Button variant="outline" onClick={onReset}>
        Recommencer
      </Button>
      <Button variant="outline" onClick={onCopy} className="gap-2">
        <Copy className="h-4 w-4" />
        Copier
      </Button>
      <Button variant="outline" onClick={onExport} className="gap-2">
        <Download className="h-4 w-4" />
        Exporter
      </Button>
      <Button 
        onClick={onSave} 
        disabled={isSaving}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 gap-2"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sauvegarde...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Sauvegarder
          </>
        )}
      </Button>
    </>
  );
}
