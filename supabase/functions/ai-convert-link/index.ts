import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!url) {
      throw new Error("URL is required");
    }

    // Detect content type from URL
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isTwitter = url.includes('twitter.com') || url.includes('x.com');
    const isLinkedIn = url.includes('linkedin.com');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: `You are a content creator assistant. Given a URL, generate content in multiple formats for InvestorPaisa:

1. THREAD: A Twitter-style thread (5-7 tweets with key insights)
2. CAROUSEL: 5-7 slides for a carousel post (title + brief content each)
3. TIP: A single actionable tip extracted from the content
4. VIDEO_SCRIPT: A brief script for a 1-minute explainer video

If you can't access the URL, generate placeholder content based on the URL pattern.

Respond in JSON:
{
  "title": "Title derived from URL",
  "thread": ["Tweet 1...", "Tweet 2...", ...],
  "carousel": [{"title": "Slide 1", "content": "..."}, ...],
  "tip": { "title": "Tip title", "content": "Tip content" },
  "video": { "hook": "Opening hook", "body": "Main content", "cta": "Call to action" },
  "source_type": "youtube|article|social",
  "tags": ["tag1", "tag2"]
}` 
          },
          { role: "user", content: `Convert this URL to InvestorPaisa content: ${url}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON response
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = {
        title: "Content from link",
        thread: ["Interesting insights from this link...", "Key takeaway #1", "Key takeaway #2"],
        carousel: [{ title: "Overview", content: "Content summary" }],
        tip: { title: "Quick Tip", content: "Review the linked content for more details" },
        video: { hook: "Check this out!", body: "Key insights from this content", cta: "Follow for more!" },
        source_type: isYouTube ? "youtube" : "article",
        tags: ["finance", "investing"]
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-convert-link error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
