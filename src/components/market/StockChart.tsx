import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { OHLCData } from "@/services/market/marketService";

interface StockChartProps {
  data: OHLCData[];
  showVolume?: boolean;
  height?: number;
  type?: "line" | "candlestick";
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Open</span>
          <span className="font-medium">₹{data.open?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">High</span>
          <span className="font-medium text-green-600">₹{data.high?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Low</span>
          <span className="font-medium text-red-600">₹{data.low?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Close</span>
          <span className="font-medium">₹{data.close?.toFixed(2)}</span>
        </div>
        {data.volume > 0 && (
          <div className="flex justify-between gap-4 border-t pt-1 mt-1">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-medium">{data.volume?.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StockChart({ data, showVolume = true, height = 400, type = "line" }: StockChartProps) {
  // Process data for chart
  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      name: d.timestamp.split("T")[0] || d.timestamp,
      color: d.close >= d.open ? "hsl(var(--chart-2))" : "hsl(var(--destructive))",
    }));
  }, [data]);

  // Calculate price range for Y axis
  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    if (!data.length) return { minPrice: 0, maxPrice: 100, avgPrice: 50 };
    
    const prices = data.flatMap(d => [d.high, d.low, d.open, d.close]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      avgPrice: data.reduce((sum, d) => sum + d.close, 0) / data.length,
    };
  }, [data]);

  // Max volume for secondary Y axis
  const maxVolume = useMemo(() => {
    return Math.max(...data.map(d => d.volume || 0));
  }, [data]);

  if (!data.length) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ className: "stroke-muted" }}
          interval="preserveStartEnd"
        />
        <YAxis 
          yAxisId="price"
          domain={[minPrice, maxPrice]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ className: "stroke-muted" }}
          tickFormatter={(value) => `₹${value.toFixed(0)}`}
          width={60}
        />
        {showVolume && (
          <YAxis 
            yAxisId="volume"
            orientation="right"
            domain={[0, maxVolume * 2]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ className: "stroke-muted" }}
            tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
            width={50}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine 
          yAxisId="price" 
          y={avgPrice} 
          stroke="hsl(var(--muted-foreground))" 
          strokeDasharray="5 5"
          opacity={0.5}
        />
        
        {/* Volume bars */}
        {showVolume && (
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="hsl(var(--muted))"
            opacity={0.3}
            radius={[2, 2, 0, 0]}
          />
        )}
        
        {/* Price line */}
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="close"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
