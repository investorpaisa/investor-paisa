import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface AIInsightPanelProps {
  symbol: string;
  insight?: string;
  isLoading?: boolean;
  error?: Error | null;
}

export default function AIInsightPanel({
  symbol,
  insight,
  isLoading,
  error,
}: AIInsightPanelProps) {
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["market", "ai", "insight", symbol] });
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Insight
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </span>
          {/* Only show refresh if there's an error or no insight yet */}
          {(error || !insight) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message.includes("429") 
                ? "Rate limit exceeded. Please try again in a moment."
                : error.message.includes("402")
                ? "AI credits exhausted. Please add funds to continue."
                : "Unable to generate insight. Please try again."}
            </AlertDescription>
          </Alert>
        ) : insight ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm leading-relaxed text-foreground/90">
              {insight}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            AI insight will appear here once market data is loaded.
          </p>
        )}
        
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            AI-generated analysis. Not financial advice.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
