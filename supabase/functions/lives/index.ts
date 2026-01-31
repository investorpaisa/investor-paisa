import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET /lives - List all live sessions
    if (req.method === "GET") {
      const status = url.searchParams.get("status") || "scheduled,live";
      const statuses = status.split(",");

      const { data, error } = await supabase
        .from("live_sessions")
        .select(`
          id,
          title,
          description,
          start_time,
          status,
          is_free,
          price,
          participant_count,
          max_participants,
          topics,
          cover_url,
          expert_id,
          duration_minutes
        `)
        .in("status", statuses)
        .order("start_time", { ascending: true })
        .limit(20);

      if (error) throw error;

      // Fetch expert profiles
      if (data && data.length > 0) {
        const expertIds = [...new Set(data.map(s => s.expert_id))];
        const { data: experts } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, is_verified")
          .in("id", expertIds);

        const expertsMap = new Map(experts?.map(e => [e.id, e]) || []);
        
        const enrichedData = data.map(session => ({
          ...session,
          expert: expertsMap.get(session.expert_id) || null
        }));

        return new Response(JSON.stringify(enrichedData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /lives/:id/join - Join a session
    if (req.method === "POST" && url.pathname.includes("/join")) {
      const sessionId = url.pathname.split("/")[2];
      const authHeader = req.headers.get("Authorization");
      
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add participant
      const { error } = await supabase
        .from("session_participants")
        .upsert({
          session_id: sessionId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        }, {
          onConflict: "session_id,user_id"
        });

      if (error) throw error;

      // Update participant count
      await supabase.rpc("increment_session_participants", { session_id: sessionId });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("lives error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
