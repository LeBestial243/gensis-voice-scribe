
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from "react";

interface EmotionDataPoint {
  date: string;
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  [key: string]: string | number;
}

interface EmotionalChartProps {
  data: EmotionDataPoint[];
}

export function EmotionalChart({ data }: EmotionalChartProps) {
  // If we don't have data, show a placeholder message
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed rounded-lg bg-muted/20">
        <p className="text-muted-foreground">Pas de données émotionnelles disponibles</p>
      </div>
    );
  }

  // Colors for different emotions
  const emotionColors = {
    joy: "#4CAF50",       // Green
    sadness: "#2196F3",   // Blue
    anger: "#F44336",     // Red
    fear: "#9C27B0",      // Purple
    surprise: "#FF9800",  // Orange
    disgust: "#795548"    // Brown
  };

  // Format date for better display on the chart
  const formattedData = useMemo(() => {
    return data.map(entry => ({
      ...entry,
      date: new Date(entry.date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      })
    }));
  }, [data]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-lg">
          <p className="font-semibold">{label}</p>
          <div className="grid gap-1 mt-1">
            {payload.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm capitalize">
                  {item.name}: {Number(item.value).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate moving averages for smoother lines
  const smoothedData = useMemo(() => {
    if (data.length <= 2) return formattedData;
    
    const emotionKeys = Object.keys(emotionColors);
    const windowSize = 2; // Size of the moving average window
    
    return formattedData.map((point, idx) => {
      if (idx < windowSize || idx >= formattedData.length - windowSize) {
        return point; // Return original for edges
      }
      
      const smoothed = { ...point };
      
      emotionKeys.forEach(emotion => {
        let sum = 0;
        for (let i = idx - windowSize; i <= idx + windowSize; i++) {
          if (i >= 0 && i < formattedData.length) {
            // Convert to number explicitly before addition
            const value = Number(formattedData[i][emotion]);
            sum += isNaN(value) ? 0 : value;
          }
        }
        smoothed[emotion] = sum / (2 * windowSize + 1);
      });
      
      return smoothed;
    });
  }, [formattedData]);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={smoothedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {Object.entries(emotionColors).map(([emotion, color]) => (
            <Line
              key={emotion}
              type="monotone"
              dataKey={emotion}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
