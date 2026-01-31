import { useState, useMemo } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw, 
  BarChart3,
  Globe,
  Bitcoin,
  IndianRupee,
  Home,
  Users,
  MessageCircle,
  Bell,
  LogOut
} from "lucide-react";
import { useMarketBatch, useForexRate, useCryptoQuote } from "@/hooks/useMarketData";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Stock symbols for different markets
const INDIAN_STOCKS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "ITC"];
const GLOBAL_INDICES = ["SPY", "QQQ", "DIA", "VTI"];
const FOREX_PAIRS = ["USD/INR", "EUR/INR", "GBP/INR", "JPY/INR"];
const CRYPTO_SYMBOLS = ["BTC/USD", "ETH/USD", "BNB/USD", "SOL/USD"];

interface QuoteCardProps {
  symbol: string;
  price: number;
  change: number;
  percentChange: number;
  onClick?: () => void;
  isLoading?: boolean;
}

function QuoteCard({ symbol, price, change, percentChange, onClick, isLoading }: QuoteCardProps) {
  const isPositive = change >= 0;
  
  if (isLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-24 mb-1" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{ borderLeftColor: isPositive ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-sm">{symbol}</span>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="text-xl font-bold">
          ₹{price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </div>
        <div className={cn(
          "text-sm flex items-center gap-1",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          <span>{isPositive ? "+" : ""}{change.toFixed(2)}</span>
          <span>({isPositive ? "+" : ""}{percentChange.toFixed(2)}%)</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ForexCard({ pair, enabled }: { pair: string; enabled: boolean }) {
  const { data, isLoading } = useForexRate(pair, enabled);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4">
          <span className="text-sm font-medium">{pair}</span>
          <div className="text-muted-foreground text-sm">No data</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{pair}</span>
        </div>
        <div className="text-xl font-bold">
          ₹{data.rate.toFixed(4)}
        </div>
        <div className="text-xs text-muted-foreground">
          Updated: {new Date(data.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

function CryptoCard({ symbol, enabled }: { symbol: string; enabled: boolean }) {
  const { data, isLoading } = useCryptoQuote(symbol, enabled);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-6 w-24 mb-1" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4">
          <span className="text-sm font-medium">{symbol}</span>
          <div className="text-muted-foreground text-sm">No data</div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change >= 0;

  return (
    <Card className="border-l-4" style={{ borderLeftColor: isPositive ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Bitcoin className="h-4 w-4 text-orange-500" />
          <span className="font-semibold text-sm">{symbol}</span>
        </div>
        <div className="text-xl font-bold">
          ${data.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </div>
        <div className={cn(
          "text-sm",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? "+" : ""}{data.percentChange.toFixed(2)}%
        </div>
      </CardContent>
    </Card>
  );
}

function MarketNav() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Markets', href: '/markets', icon: BarChart3 },
    { name: 'Circles', href: '/circles', icon: Users },
    { name: 'Messages', href: '/inbox', icon: MessageCircle },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-end h-16">

          <div className="flex items-center space-x-2">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                size="sm"
                className="flex flex-col items-center p-2 h-12 w-12 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                onClick={() => navigate(item.href)}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            ))}
            
            <div className="ml-4 flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 rounded-full hover:bg-muted"
                onClick={() => navigate('/profile')}
              >
                <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile?.full_name?.charAt(0) || user?.user_metadata?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-8 w-8 p-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Markets() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("indian");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch batch quotes for Indian stocks
  const { data: indianQuotes, isLoading: indianLoading, refetch: refetchIndian } = useMarketBatch(
    INDIAN_STOCKS,
    activeTab === "indian"
  );

  // Fetch batch quotes for global indices
  const { data: globalQuotes, isLoading: globalLoading, refetch: refetchGlobal } = useMarketBatch(
    GLOBAL_INDICES,
    activeTab === "global"
  );

  // Compute gainers and losers
  const { topGainers, topLosers } = useMemo(() => {
    const allQuotes = [...(indianQuotes || []), ...(globalQuotes || [])];
    const sorted = [...allQuotes].sort((a, b) => b.percentChange - a.percentChange);
    
    return {
      topGainers: sorted.slice(0, 5),
      topLosers: sorted.slice(-5).reverse(),
    };
  }, [indianQuotes, globalQuotes]);

  const handleStockClick = (symbol: string) => {
    navigate(`/markets/${symbol}`);
  };

  const handleRefresh = () => {
    if (activeTab === "indian") {
      refetchIndian();
    } else if (activeTab === "global") {
      refetchGlobal();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketNav />
      
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Markets
            </h1>
            <p className="text-muted-foreground">Real-time market data powered by live APIs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search symbol..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="indian" className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              India
            </TabsTrigger>
            <TabsTrigger value="global" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              Global
            </TabsTrigger>
            <TabsTrigger value="forex" className="flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              Forex
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-1">
              <Bitcoin className="h-4 w-4" />
              Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indian" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Indian Stocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {indianLoading ? (
                    Array(8).fill(0).map((_, i) => (
                      <QuoteCard key={i} symbol="" price={0} change={0} percentChange={0} isLoading />
                    ))
                  ) : (
                    indianQuotes?.map((quote) => (
                      <QuoteCard
                        key={quote.symbol}
                        symbol={quote.symbol}
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

            {/* Gainers & Losers */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topGainers.map((quote) => (
                      <div 
                        key={quote.symbol}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => handleStockClick(quote.symbol)}
                      >
                        <span className="font-medium">{quote.symbol}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          +{quote.percentChange.toFixed(2)}%
                        </Badge>
                      </div>
                    ))}
                    {topGainers.length === 0 && (
                      <p className="text-muted-foreground text-sm">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topLosers.map((quote) => (
                      <div 
                        key={quote.symbol}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => handleStockClick(quote.symbol)}
                      >
                        <span className="font-medium">{quote.symbol}</span>
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          {quote.percentChange.toFixed(2)}%
                        </Badge>
                      </div>
                    ))}
                    {topLosers.length === 0 && (
                      <p className="text-muted-foreground text-sm">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="global" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Indices & ETFs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {globalLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <QuoteCard key={i} symbol="" price={0} change={0} percentChange={0} isLoading />
                    ))
                  ) : (
                    globalQuotes?.map((quote) => (
                      <QuoteCard
                        key={quote.symbol}
                        symbol={quote.symbol}
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
          </TabsContent>

          <TabsContent value="forex" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Forex Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {FOREX_PAIRS.map((pair) => (
                    <ForexCard key={pair} pair={pair} enabled={activeTab === "forex"} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bitcoin className="h-5 w-5" />
                  Cryptocurrency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CRYPTO_SYMBOLS.map((symbol) => (
                    <CryptoCard key={symbol} symbol={symbol} enabled={activeTab === "crypto"} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
