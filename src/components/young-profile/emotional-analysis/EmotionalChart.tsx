
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface EmotionPoint {
  timestamp: number;
  value: number;
}

interface EmotionSeries {
  name: string;
  data: EmotionPoint[];
}

interface EmotionalChartProps {
  data: EmotionSeries[];
}

// Map of emotion names to colors
const EMOTION_COLORS: Record<string, string> = {
  'joie': '#4ade80', // green
  'tristesse': '#60a5fa', // blue
  'colère': '#f87171', // red
  'peur': '#a78bfa', // purple
  'surprise': '#facc15', // yellow
  'dégoût': '#a3a3a3', // gray
  'confiance': '#2dd4bf', // teal
};

// Map of emotion names to French translations
const EMOTION_LABELS: Record<string, string> = {
  'joie': 'Joie',
  'tristesse': 'Tristesse',
  'colère': 'Colère',
  'peur': 'Peur/Anxiété',
  'surprise': 'Surprise',
  'dégoût': 'Dégoût',
  'confiance': 'Confiance',
};

export function EmotionalChart({ data }: EmotionalChartProps) {
  // Process data for chart consumption
  const chartData = processDataForChart(data);
  
  // If we have no data, show an empty state
  if (chartData.length === 0) {
    return (
      <Card className="w-full h-[300px] flex items-center justify-center">
        <CardContent className="text-muted-foreground text-center">
          <p>Aucune donnée émotionnelle disponible.</p>
          <p className="text-sm">Analysez des transcriptions pour voir l'évolution émotionnelle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Évolution émotionnelle</CardTitle>
        <CardDescription>
          Intensité des émotions détectées au fil des transcriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis 
                domain={[0, 1]} 
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const date = new Date(payload[0].payload.date);
                    
                    return (
                      <div className="bg-background border rounded-md shadow-md p-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatDistanceToNow(date, { addSuffix: true, locale: fr })}
                        </p>
                        {payload.map((entry) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <p className="text-xs">
                              {EMOTION_LABELS[entry.name] || entry.name}: 
                              <span className="font-medium ml-1">
                                {Math.round(entry.value * 100)}%
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {data.map((series) => (
                <Line
                  key={series.name}
                  type="monotone"
                  name={EMOTION_LABELS[series.name] || series.name}
                  dataKey={series.name}
                  stroke={EMOTION_COLORS[series.name] || '#888888'}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to process data series into a format suitable for Recharts
function processDataForChart(series: EmotionSeries[]): any[] {
  if (!series || series.length === 0) {
    return [];
  }
  
  // Collect all timestamps
  const allTimestamps = new Set<number>();
  series.forEach(s => {
    s.data.forEach(point => {
      allTimestamps.add(point.timestamp);
    });
  });
  
  // Create a sorted array of unique timestamps
  const timestamps = Array.from(allTimestamps).sort((a, b) => a - b);
  
  // Create a data point for each timestamp
  return timestamps.map(timestamp => {
    const dataPoint: Record<string, any> = { date: timestamp };
    
    // Add values for each series
    series.forEach(s => {
      const point = s.data.find(p => p.timestamp === timestamp);
      dataPoint[s.name] = point ? point.value : null;
    });
    
    return dataPoint;
  });
}
