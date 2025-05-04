
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CopingStrategy } from "@/services/emotionalAnalysisService";

interface CopingStrategiesProps {
  strategies: CopingStrategy[];
}

export function CopingStrategies({ strategies }: CopingStrategiesProps) {
  if (!strategies || strategies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stratégies d'adaptation</CardTitle>
          <CardDescription>
            Comment le jeune gère ses émotions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Aucune stratégie d'adaptation n'a été identifiée. Analysez plus de transcriptions pour obtenir des résultats.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Sort strategies by effectiveness (highest first)
  const sortedStrategies = [...strategies].sort((a, b) => b.effectiveness - a.effectiveness);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stratégies d'adaptation</CardTitle>
        <CardDescription>
          Comment le jeune gère ses émotions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sortedStrategies.map((strategy, index) => (
            <li key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{strategy.strategy}</span>
                <span className="text-sm text-muted-foreground">
                  Efficacité: {strategy.effectiveness}%
                </span>
              </div>
              <Progress value={strategy.effectiveness} className="h-2" />
              <div className="flex flex-wrap gap-1 mt-1">
                {strategy.emotions.map((emotion, idx) => (
                  <Badge key={idx} variant="outline" className="font-normal">
                    {emotion}
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
