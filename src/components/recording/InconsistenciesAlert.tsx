
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { InconsistencyCheck } from "@/types/inconsistency";

interface InconsistenciesAlertProps {
  inconsistencies: InconsistencyCheck[];
}

export function InconsistenciesAlert({ inconsistencies }: InconsistenciesAlertProps) {
  if (!inconsistencies.length) return null;

  const errors = inconsistencies.filter(i => i.severity === 'error');
  const warnings = inconsistencies.filter(i => i.severity === 'warning');

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4 mr-2" />
      <AlertTitle>Attention : Incohérences détectées</AlertTitle>
      <AlertDescription>
        {errors.length > 0 && (
          <div className="mb-2">
            <p className="font-semibold text-red-600">Erreurs critiques :</p>
            <ul className="list-disc pl-4">
              {errors.map((error, i) => (
                <li key={i} className="text-red-700">{error.message}</li>
              ))}
            </ul>
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            <p className="font-semibold text-yellow-600">Avertissements :</p>
            <ul className="list-disc pl-4">
              {warnings.map((warning, i) => (
                <li key={i} className="text-yellow-700">{warning.message}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-2 text-sm">
          Veuillez vérifier et corriger le contenu avant de sauvegarder.
        </p>
      </AlertDescription>
    </Alert>
  );
}
