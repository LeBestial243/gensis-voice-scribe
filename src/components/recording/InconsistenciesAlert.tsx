
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface InconsistenciesAlertProps {
  inconsistencies: string[];
}

export function InconsistenciesAlert({ inconsistencies }: InconsistenciesAlertProps) {
  if (!inconsistencies.length) return null;

  return (
    <Alert variant="default" className="w-full border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertTitle>Incohérences potentielles</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-2 text-sm">
          {inconsistencies.map((inconsistency, index) => (
            <li key={index}>{inconsistency}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
