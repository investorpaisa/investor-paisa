import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

const AVAILABLE_INDICATORS = [
  { id: "RSI", name: "RSI", description: "Relative Strength Index" },
  { id: "MACD", name: "MACD", description: "Moving Average Convergence Divergence" },
  { id: "SMA", name: "SMA", description: "Simple Moving Average" },
  { id: "EMA", name: "EMA", description: "Exponential Moving Average" },
  { id: "BBANDS", name: "Bollinger", description: "Bollinger Bands" },
];

interface IndicatorsPanelProps {
  symbol: string;
  enabledIndicators: string[];
  onToggle: (indicator: string) => void;
  indicators?: Record<string, any[]>;
  isLoading?: boolean;
}

function getIndicatorValue(data: any[]): string {
  if (!data || !data.length) return "—";
  
  const latest = data[0];
  
  // Handle different indicator formats
  if (latest.rsi !== undefined) {
    const rsi = parseFloat(latest.rsi);
    return rsi.toFixed(2);
  }
  if (latest.macd !== undefined) {
    return parseFloat(latest.macd).toFixed(4);
  }
  if (latest.sma !== undefined) {
    return parseFloat(latest.sma).toFixed(2);
  }
  if (latest.ema !== undefined) {
    return parseFloat(latest.ema).toFixed(2);
  }
  if (latest.upper_band !== undefined) {
    return `${parseFloat(latest.lower_band).toFixed(2)} - ${parseFloat(latest.upper_band).toFixed(2)}`;
  }
  
  return "—";
}

function getIndicatorSignal(id: string, data: any[]): { signal: string; color: string } {
  if (!data || !data.length) return { signal: "No data", color: "text-muted-foreground" };
  
  const latest = data[0];
  
  if (id === "RSI" && latest.rsi !== undefined) {
    const rsi = parseFloat(latest.rsi);
    if (rsi > 70) return { signal: "Overbought", color: "text-red-600" };
    if (rsi < 30) return { signal: "Oversold", color: "text-green-600" };
    return { signal: "Neutral", color: "text-muted-foreground" };
  }
  
  if (id === "MACD" && latest.macd !== undefined && latest.macd_signal !== undefined) {
    const macd = parseFloat(latest.macd);
    const signal = parseFloat(latest.macd_signal);
    if (macd > signal) return { signal: "Bullish", color: "text-green-600" };
    return { signal: "Bearish", color: "text-red-600" };
  }
  
  return { signal: "—", color: "text-muted-foreground" };
}

export default function IndicatorsPanel({
  symbol,
  enabledIndicators,
  onToggle,
  indicators,
  isLoading,
}: IndicatorsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Technical Indicators
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {AVAILABLE_INDICATORS.map((indicator) => {
            const isEnabled = enabledIndicators.includes(indicator.id);
            const indicatorData = indicators?.[indicator.id];
            const { signal, color } = getIndicatorSignal(indicator.id, indicatorData || []);
            
            return (
              <div 
                key={indicator.id}
                className={`p-4 rounded-lg border transition-colors ${
                  isEnabled ? "bg-muted/50 border-primary/30" : "bg-background"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={indicator.id} className="font-medium cursor-pointer">
                    {indicator.name}
                  </Label>
                  <Switch
                    id={indicator.id}
                    checked={isEnabled}
                    onCheckedChange={() => onToggle(indicator.id)}
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {indicator.description}
                </p>
                {isEnabled && (
                  <>
                    {isLoading ? (
                      <>
                        <Skeleton className="h-6 w-20 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </>
                    ) : (
                      <>
                        <div className="text-lg font-semibold">
                          {getIndicatorValue(indicatorData || [])}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${color}`}
                        >
                          {signal}
                        </Badge>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
