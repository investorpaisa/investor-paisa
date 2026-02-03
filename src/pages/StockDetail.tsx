import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Clock,
  Activity,
  BarChart3,
  Home,
  Users,
  MessageCircle,
  Bell,
  LogOut
} from "lucide-react";
import { 
  useMarketQuote, 
  useMarketHistory, 
  useMarketInsight,
  useMultipleIndicators
} from "@/hooks/useMarketData";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StockChart from "@/components/market/StockChart";
import IndicatorsPanel from "@/components/market/IndicatorsPanel";
import AIInsightPanel from "@/components/market/AIInsightPanel";

const TIMEFRAMES = [
  { label: "1D", interval: "1min", outputsize: 60 },
  { label: "1W", interval: "15min", outputsize: 96 },
  { label: "1M", interval: "1day", outputsize: 30 },
  { label: "3M", interval: "1day", outputsize: 90 },
  { label: "1Y", interval: "1week", outputsize: 52 },
];

// StockDetailNav removed - using MainLayout navigation instead

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[2]); // Default 1M
  const [showVolume, setShowVolume] = useState(true);
  const [enabledIndicators, setEnabledIndicators] = useState<string[]>([]);

  // Fetch quote data
  const { 
    data: quote, 
    isLoading: quoteLoading, 
    refetch: refetchQuote 
  } = useMarketQuote(symbol || "");

  // Fetch history based on selected timeframe
  const { 
    data: history, 
    isLoading: historyLoading 
  } = useMarketHistory(
    symbol || "", 
    selectedTimeframe.interval, 
    selectedTimeframe.outputsize
  );

  // Fetch multiple indicators
  const {
    data: indicators,
    isLoading: indicatorsLoading
  } = useMultipleIndicators(
    symbol || "",
    enabledIndicators,
    selectedTimeframe.interval,
    enabledIndicators.length > 0
  );

  // AI Insight
  const {
    data: insight,
    isLoading: insightLoading,
    error: insightError
  } = useMarketInsight(
    symbol || "",
    {
      price: quote?.price,
      change: quote?.change,
      percentChange: quote?.percentChange,
      history: history,
      indicators: indicators,
    },
    !!quote
  );

  const isPositive = (quote?.change ?? 0) >= 0;

  // Reversed history for charts (oldest first)
  const chartData = useMemo(() => {
    if (!history) return [];
    return [...history].reverse();
  }, [history]);

  const handleIndicatorToggle = (indicator: string) => {
    setEnabledIndicators(prev => 
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  if (!symbol) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p>Symbol not found</p>
      </div>
    );
  }

  // Hide refresh button if data loaded successfully
  const hasData = !!quote && !quoteLoading;

  return (
    <div className="container mx-auto py-3 px-2 sm:px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/markets")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            {quoteLoading ? (
              <>
                <Skeleton className="h-8 w-40 mb-2" />
                <Skeleton className="h-6 w-60" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  {symbol}
                  {quote?.stale && (
                    <Badge variant="outline" className="text-xs">Delayed</Badge>
                  )}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-2xl font-semibold">
                    ₹{quote?.price.toLocaleString("en-IN", { maximumFractionDigits: 2 }) || "—"}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-lg",
                    isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {isPositive ? (
                      <TrendingUp className="h-5 w-5" />
                    ) : (
                      <TrendingDown className="h-5 w-5" />
                    )}
                    <span>
                      {isPositive ? "+" : ""}{quote?.change.toFixed(2) || 0}
                      {" "}({isPositive ? "+" : ""}{quote?.percentChange.toFixed(2) || 0}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Conditional refresh button - only show if no data */}
          {!hasData && (
            <Button variant="outline" size="sm" onClick={() => refetchQuote()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Timeframe Selector */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Price Chart
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="volume" 
                        checked={showVolume}
                        onCheckedChange={setShowVolume}
                      />
                      <Label htmlFor="volume" className="text-sm">Volume</Label>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {TIMEFRAMES.map((tf) => (
                    <Button
                      key={tf.label}
                      variant={selectedTimeframe.label === tf.label ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeframe(tf)}
                    >
                      {tf.label}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : chartData.length > 0 ? (
                  <StockChart 
                    data={chartData} 
                    showVolume={showVolume}
                    height={400}
                  />
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No historical data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Indicators Panel */}
            <IndicatorsPanel
              symbol={symbol}
              enabledIndicators={enabledIndicators}
              onToggle={handleIndicatorToggle}
              indicators={indicators}
              isLoading={indicatorsLoading}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Today's Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quoteLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Open</span>
                      <span className="font-medium">
                        ₹{quote?.open?.toLocaleString("en-IN") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">High</span>
                      <span className="font-medium text-green-600">
                        ₹{quote?.high?.toLocaleString("en-IN") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Low</span>
                      <span className="font-medium text-red-600">
                        ₹{quote?.low?.toLocaleString("en-IN") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Prev Close</span>
                      <span className="font-medium">
                        ₹{quote?.previousClose?.toLocaleString("en-IN") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-medium">
                        {quote?.volume?.toLocaleString("en-IN") || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Provider
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {quote?.provider || "—"}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* AI Insight */}
            <AIInsightPanel
              symbol={symbol}
              insight={insight}
              isLoading={insightLoading}
              error={insightError}
            />
          </div>
        </div>
      </div>
  );
}
