import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

interface MarketContext {
  symbol: string;
  price?: number;
  change?: number;
  percentChange?: number;
  history?: any[];
  indicators?: Record<string, any[]>;
}

async function callLovableAI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limits exceeded, please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required, please add funds.");
    }
    const text = await response.text();
    throw new Error(`AI gateway error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Unable to generate insight.";
}

async function getMarketInsight(context: MarketContext): Promise<string> {
  const systemPrompt = `You are an expert financial analyst providing clear, actionable market insights for retail investors in India. 
Your explanations should be:
- Simple and jargon-free
- Under 200 words
- Include potential reasons for price movement
- Mention any relevant technical indicators if provided
- Be balanced and not give financial advice`;

  const priceInfo = context.price 
    ? `Current price: ₹${context.price.toLocaleString()}, Change: ${context.change?.toFixed(2)} (${context.percentChange?.toFixed(2)}%)`
    : "Price data not available";

  const historyInfo = context.history?.length 
    ? `Recent price trend: ${context.history.slice(0, 5).map(h => h.close).join(" → ")}`
    : "";

  const indicatorInfo = context.indicators 
    ? Object.entries(context.indicators).map(([name, values]) => 
        `${name}: ${values[0]?.[name.toLowerCase()] || values[0]?.value || "N/A"}`
      ).join(", ")
    : "";

  const userPrompt = `Explain today's movement for ${context.symbol} in simple terms for an Indian retail investor.

${priceInfo}
${historyInfo}
${indicatorInfo}

Focus on: What happened, why it might have happened, and what to watch for.`;

  return await callLovableAI(systemPrompt, userPrompt);
}

async function getStockSummary(context: MarketContext): Promise<string> {
  const systemPrompt = `You are a financial analyst creating concise stock summaries for retail investors.
Provide a brief overview including:
- Company context
- Recent performance
- Key metrics to watch
Keep it under 150 words and avoid financial advice.`;

  const userPrompt = `Create a brief summary for ${context.symbol}.

Current data:
- Price: ${context.price ? `₹${context.price.toLocaleString()}` : "N/A"}
- Change: ${context.percentChange ? `${context.percentChange.toFixed(2)}%` : "N/A"}

Recent history: ${context.history?.slice(0, 5).map(h => h.close).join(" → ") || "N/A"}`;

  return await callLovableAI(systemPrompt, userPrompt);
}

async function explainIndicator(indicator: string, values: any[], symbol: string): Promise<string> {
  const systemPrompt = `You are a technical analyst explaining indicators to beginners.
Keep explanations:
- Simple and practical
- Under 100 words
- Focused on what the current value means`;

  const currentValue = values[0];
  const userPrompt = `Explain what the ${indicator} indicator shows for ${symbol}.

Current ${indicator} value: ${JSON.stringify(currentValue)}

What does this mean for the stock? Is it overbought, oversold, or neutral?`;

  return await callLovableAI(systemPrompt, userPrompt);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { type, symbol, context } = body;

    let result: string;
    let modelUsed = "google/gemini-3-flash-preview";

    switch (type) {
      case "market-insight": {
        result = await getMarketInsight({
          symbol,
          price: context?.price,
          change: context?.change,
          percentChange: context?.percentChange,
          history: context?.history,
          indicators: context?.indicators,
        });
        break;
      }

      case "stock-summary": {
        result = await getStockSummary({
          symbol,
          price: context?.price,
          change: context?.change,
          percentChange: context?.percentChange,
          history: context?.history,
        });
        break;
      }

      case "indicator-explainer": {
        if (!context?.indicator || !context?.values) {
          return new Response(JSON.stringify({ success: false, error: "Indicator and values required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        result = await explainIndicator(context.indicator, context.values, symbol);
        break;
      }

      default:
        return new Response(JSON.stringify({ success: false, error: "Invalid type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    console.log(`Market AI request: ${type}, symbol: ${symbol}, latency: ${Date.now() - startTime}ms`);

    return new Response(JSON.stringify({
      success: true,
      data: result,
      model: modelUsed,
      latency_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market AI error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: errorMessage.includes("429") ? 429 : errorMessage.includes("402") ? 402 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
