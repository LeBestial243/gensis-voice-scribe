
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AlertMessageProps {
  error?: string | null;
  inconsistencies?: string[];
}

export const AlertMessage = ({ error, inconsistencies }: AlertMessageProps) => {
  if (!error && (!inconsistencies || inconsistencies.length === 0)) {
    return null;
  }

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {inconsistencies && inconsistencies.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Incohérences détectées:</p>
              <ul className="list-disc pl-4 space-y-1">
                {inconsistencies.map((inconsistency, index) => (
                  <li key={index}>{inconsistency}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
