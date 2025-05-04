
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmotionalTrigger } from "@/services/emotionalAnalysisService";

interface EmotionalTriggersProps {
  triggers: EmotionalTrigger[];
}

// Map of emotion names to colors for badges
const EMOTION_COLORS: Record<string, string> = {
  'joie': 'bg-green-100 text-green-800 hover:bg-green-200',
  'tristesse': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  'colère': 'bg-red-100 text-red-800 hover:bg-red-200',
  'stress': 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  'peur': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
  'surprise': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
  'dégoût': 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  'confiance': 'bg-teal-100 text-teal-800 hover:bg-teal-200',
  'frustration': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
  'anxiété': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
};

export function EmotionalTriggers({ triggers }: EmotionalTriggersProps) {
  if (!triggers || triggers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facteurs déclencheurs</CardTitle>
          <CardDescription>
            Situations qui provoquent des réactions émotionnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Aucun facteur déclencheur n'a été identifié. Analysez plus de transcriptions pour obtenir des résultats.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Sort triggers by frequency (highest first)
  const sortedTriggers = [...triggers].sort((a, b) => b.frequency - a.frequency);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Facteurs déclencheurs</CardTitle>
        <CardDescription>
          Situations qui provoquent des réactions émotionnelles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {sortedTriggers.map((trigger, index) => (
            <li key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className="w-2 h-2 bg-primary rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  <div 
                    className="w-4 h-4 rounded-full animate-ping opacity-25"
                    style={{ 
                      backgroundColor: trigger.frequency > 3 ? '#ef4444' : 
                                      trigger.frequency > 2 ? '#f59e0b' : '#22c55e' 
                    }}
                  />
                </div>
                <span>{trigger.trigger}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`font-normal ${EMOTION_COLORS[trigger.emotion] || ''}`}
                >
                  {trigger.emotion}
                </Badge>
                <Badge variant="secondary">
                  {trigger.frequency} {trigger.frequency > 1 ? 'occurrences' : 'occurrence'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
