import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  BarChart3,
  Globe,
  Bitcoin,
  IndianRupee,
  Newspaper
} from "lucide-react";
import { useMarketBatch, useCryptoQuote } from "@/hooks/useMarketData";
import { getSupabaseUrl, getSupabaseAnonKey } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TrendingStructuredFeed } from "@/components/feed/TrendingStructuredFeed";

// Specific indices for each tab
const INDIAN_INDICES = ["NIFTY50", "SENSEX", "BANKNIFTY", "NIFTYIT"];
const GLOBAL_INDICES = ["SPY", "QQQ", "DIA", "VTI"];
const CRYPTO_SYMBOLS = ["BTC/USD", "ETH/USD"];

interface CompactQuoteCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  onClick?: () => void;
  isLoading?: boolean;
  currency?: string;
}

function CompactQuoteCard({ symbol, name, price, change, percentChange, onClick, isLoading, currency = "₹" }: CompactQuoteCardProps) {
  const isPositive = change >= 0;
  
  if (isLoading) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-3">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border-l-2 cursor-pointer hover:shadow-md transition-all border border-border/50",
        isPositive ? "border-l-green-500" : "border-l-red-500"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-xs sm:text-sm truncate">{name}</span>
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          )}
        </div>
        <div className="text-base sm:text-lg font-bold">
          {currency}{price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </div>
        <div className={cn(
          "text-xs flex items-center gap-1",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          <span>{isPositive ? "+" : ""}{percentChange.toFixed(2)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}

function CryptoCard({ symbol, name, enabled }: { symbol: string; name: string; enabled: boolean }) {
  const { data, isLoading } = useCryptoQuote(symbol, enabled);
  
  if (isLoading) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-3">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-3">
          <span className="text-xs font-medium">{name}</span>
          <div className="text-muted-foreground text-xs mt-1">No data</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <Card className={cn(
      "border-l-2 border border-border/50",
      isPositive ? "border-l-green-500" : "border-l-red-500"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Bitcoin className="h-3.5 w-3.5 text-orange-500" />
          <span className="font-semibold text-xs sm:text-sm">{name}</span>
        </div>
        <div className="text-base sm:text-lg font-bold">
          ${data.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </div>
        <div className={cn(
          "text-xs",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? "+" : ""}{data.percentChange.toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  );
}

export default function Markets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch batch quotes
  const { data: indianQuotes, isLoading: indianLoading, refetch: refetchIndian, error: indianError } = useMarketBatch(
    INDIAN_INDICES,
    activeTab === "overview" || activeTab === "indian"
  );

  const { data: globalQuotes, isLoading: globalLoading, refetch: refetchGlobal, error: globalError } = useMarketBatch(
    GLOBAL_INDICES,
    activeTab === "overview" || activeTab === "global"
  );

  // Trigger RSS fetch once on mount
  useEffect(() => {
    const fetchNews = async () => {
      const sessionKey = 'markets_news_fetched';
      const lastFetch = sessionStorage.getItem(sessionKey);
      const now = Date.now();
      
      if (!lastFetch || (now - parseInt(lastFetch)) > 5 * 60 * 1000) {
        try {
          await fetch(`${getSupabaseUrl()}/functions/v1/fetch-google-rss`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getSupabaseAnonKey()}`,
              'Content-Type': 'application/json',
            },
          });
          sessionStorage.setItem(sessionKey, now.toString());
        } catch (e) {
          console.log('Markets RSS fetch triggered');
        }
      }
    };
    fetchNews();
  }, []);

  // Compute gainers and losers for overview
  const { topGainers, topLosers } = useMemo(() => {
    const allQuotes = [...(indianQuotes || [])];
    const sorted = [...allQuotes].sort((a, b) => b.percentChange - a.percentChange);
    
    return {
      topGainers: sorted.filter(q => q.percentChange > 0).slice(0, 3),
      topLosers: sorted.filter(q => q.percentChange < 0).slice(0, 3),
    };
  }, [indianQuotes]);

  const hasDataError = (indianError || globalError) && !indianQuotes?.length && !globalQuotes?.length;

  const handleStockClick = (symbol: string) => {
    navigate(`/markets/${symbol}`);
  };

  const handleRefresh = () => {
    refetchIndian();
    refetchGlobal();
  };

  // Map symbols to friendly names
  const getIndexName = (symbol: string) => {
    const names: Record<string, string> = {
      "NIFTY50": "Nifty 50",
      "SENSEX": "Sensex",
      "BANKNIFTY": "Bank Nifty",
      "NIFTYIT": "Nifty IT",
      "SPY": "S&P 500",
      "QQQ": "NASDAQ",
      "DIA": "Dow Jones",
      "VTI": "Total Market",
    };
    return names[symbol] || symbol;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Markets</h1>
            <p className="text-xs text-muted-foreground">Real-time data</p>
          </div>
        </div>
        {/* Only show refresh button on error */}
        {hasDataError && !indianLoading && !globalLoading && (
          <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-9 bg-secondary/50 rounded-xl p-0.5">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs rounded-lg h-8">
              Overview
            </TabsTrigger>
            <TabsTrigger value="indian" className="text-[10px] sm:text-xs rounded-lg h-8 gap-1">
              <IndianRupee className="h-3 w-3" />
              India
            </TabsTrigger>
            <TabsTrigger value="global" className="text-[10px] sm:text-xs rounded-lg h-8 gap-1">
              <Globe className="h-3 w-3" />
              Global
            </TabsTrigger>
            <TabsTrigger value="crypto" className="text-[10px] sm:text-xs rounded-lg h-8 gap-1">
              <Bitcoin className="h-3 w-3" />
              Crypto
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Featured Indices */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Key Indices</h3>
              <div className="grid grid-cols-2 gap-2">
                {indianLoading ? (
                  Array(2).fill(0).map((_, i) => (
                    <CompactQuoteCard key={i} symbol="" name="" price={0} change={0} percentChange={0} isLoading />
                  ))
                ) : (
                  indianQuotes?.slice(0, 2).map((quote) => (
                    <CompactQuoteCard
                      key={quote.symbol}
                      symbol={quote.symbol}
                      name={getIndexName(quote.symbol)}
                      price={quote.price}
                      change={quote.change}
                      percentChange={quote.percentChange}
                      onClick={() => handleStockClick(quote.symbol)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Global Indices */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Global Markets</h3>
              <div className="grid grid-cols-2 gap-2">
                {globalLoading ? (
                  Array(2).fill(0).map((_, i) => (
                    <CompactQuoteCard key={i} symbol="" name="" price={0} change={0} percentChange={0} isLoading />
                  ))
                ) : (
                  globalQuotes?.slice(0, 2).map((quote) => (
                    <CompactQuoteCard
                      key={quote.symbol}
                      symbol={quote.symbol}
                      name={getIndexName(quote.symbol)}
                      price={quote.price}
                      change={quote.change}
                      percentChange={quote.percentChange}
                      currency="$"
                      onClick={() => handleStockClick(quote.symbol)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Crypto */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Crypto</h3>
              <div className="grid grid-cols-2 gap-2">
                <CryptoCard symbol="BTC/USD" name="Bitcoin" enabled={activeTab === "overview"} />
                <CryptoCard symbol="ETH/USD" name="Ethereum" enabled={activeTab === "overview"} />
              </div>
            </div>

            {/* Gainers & Losers */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border border-border/50">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-medium text-green-600 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {topGainers.map((quote) => (
                      <div 
                        key={quote.symbol}
                        className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 rounded p-1.5 -mx-1.5"
                        onClick={() => handleStockClick(quote.symbol)}
                      >
                        <span className="font-medium truncate">{getIndexName(quote.symbol)}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] h-5">
                          +{quote.percentChange.toFixed(2)}%
                        </Badge>
                      </div>
                    ))}
                    {topGainers.length === 0 && (
                      <p className="text-muted-foreground text-xs">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-2">
                    {topLosers.map((quote) => (
                      <div 
                        key={quote.symbol}
                        className="flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 rounded p-1.5 -mx-1.5"
                        onClick={() => handleStockClick(quote.symbol)}
                      >
                        <span className="font-medium truncate">{getIndexName(quote.symbol)}</span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-[10px] h-5">
                          {quote.percentChange.toFixed(2)}%
                        </Badge>
                      </div>
                    ))}
                    {topLosers.length === 0 && (
                      <p className="text-muted-foreground text-xs">No data</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Market News */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5" />
                Market News
              </h3>
              <TrendingStructuredFeed filter="all" />
            </div>
          </TabsContent>

          {/* Indian Markets Tab */}
          <TabsContent value="indian" className="space-y-4">
            <Card className="border border-border/50">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  Indian Indices
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {indianLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <CompactQuoteCard key={i} symbol="" name="" price={0} change={0} percentChange={0} isLoading />
                    ))
                  ) : (
                    indianQuotes?.map((quote) => (
                      <CompactQuoteCard
                        key={quote.symbol}
                        symbol={quote.symbol}
                        name={getIndexName(quote.symbol)}
                        price={quote.price}
                        change={quote.change}
                        percentChange={quote.percentChange}
                        onClick={() => handleStockClick(quote.symbol)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* India-specific news */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5" />
                India Market News
              </h3>
              <TrendingStructuredFeed filter="indian" />
            </div>
          </TabsContent>

          {/* Global Markets Tab */}
          <TabsContent value="global" className="space-y-4">
            <Card className="border border-border/50">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Global Indices & ETFs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {globalLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <CompactQuoteCard key={i} symbol="" name="" price={0} change={0} percentChange={0} isLoading />
                    ))
                  ) : (
                    globalQuotes?.map((quote) => (
                      <CompactQuoteCard
                        key={quote.symbol}
                        symbol={quote.symbol}
                        name={getIndexName(quote.symbol)}
                        price={quote.price}
                        change={quote.change}
                        percentChange={quote.percentChange}
                        currency="$"
                        onClick={() => handleStockClick(quote.symbol)}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Global news */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5" />
                Global Market News
              </h3>
              <TrendingStructuredFeed filter="global" />
            </div>
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="crypto" className="space-y-4">
            <Card className="border border-border/50">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bitcoin className="h-4 w-4 text-orange-500" />
                  Cryptocurrency
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="grid grid-cols-2 gap-2">
                  <CryptoCard symbol="BTC/USD" name="Bitcoin" enabled={activeTab === "crypto"} />
                  <CryptoCard symbol="ETH/USD" name="Ethereum" enabled={activeTab === "crypto"} />
                </div>
              </CardContent>
            </Card>
            
            {/* Crypto news */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <Newspaper className="h-3.5 w-3.5" />
                Crypto News
              </h3>
              <TrendingStructuredFeed filter="crypto" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
