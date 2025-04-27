
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { InconsistencyCheck } from "@/types/inconsistency";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InconsistenciesAlertProps {
  inconsistencies?: InconsistencyCheck[];
}

export function InconsistenciesAlert({ inconsistencies = [] }: InconsistenciesAlertProps) {
  if (!inconsistencies || !inconsistencies.length) return null;

  const errors = inconsistencies.filter(i => i.severity === 'error');
  const warnings = inconsistencies.filter(i => i.severity === 'warning');

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="mb-2">Attention : Incohérences détectées</AlertTitle>
          <AlertDescription>
            <ScrollArea className="max-h-32 overflow-y-auto pr-4">
              {errors.length > 0 && (
                <div className="mb-2">
                  <p className="font-semibold text-red-600 text-sm">Erreurs critiques :</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {errors.map((error, i) => (
                      <li key={i} className="text-red-700 text-xs">{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {warnings.length > 0 && (
                <div>
                  <p className="font-semibold text-yellow-600 text-sm">Avertissements :</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i} className="text-yellow-700 text-xs">{warning.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </ScrollArea>
            <p className="mt-2 text-xs text-muted-foreground">
              Veuillez vérifier et corriger le contenu avant de sauvegarder.
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
