
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { InconsistencyCheck } from "@/types/inconsistency";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InconsistenciesAlertProps {
  inconsistencies?: InconsistencyCheck[];
}

export function InconsistenciesAlert({ inconsistencies = [] }: InconsistenciesAlertProps) {
  if (!inconsistencies || !inconsistencies.length) return null;

  // Filter only date inconsistencies
  const dateInconsistencies = inconsistencies.filter(i => i.type === 'date');
  
  if (dateInconsistencies.length === 0) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-start">
        <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
        <div className="flex-1">
          <AlertTitle className="mb-2">Attention : Incohérences temporelles détectées</AlertTitle>
          <AlertDescription>
            <ScrollArea className="max-h-32 overflow-y-auto pr-4">
              <ul className="list-disc pl-4 space-y-1">
                {dateInconsistencies.map((inc, i) => (
                  <li key={i} className="text-red-700 text-sm">{inc.message}</li>
                ))}
              </ul>
            </ScrollArea>
            <p className="mt-2 text-xs text-muted-foreground">
              Veuillez vérifier les dates mentionnées avant de sauvegarder.
            </p>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
