import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBJECTS = {
  general: "You are a helpful AI study assistant. Provide clear, educational answers.",
  math: "You are an expert math tutor. Break down problems step-by-step, explain formulas, and help students understand mathematical concepts deeply.",
  science: "You are a science tutor specializing in physics, chemistry, and biology. Explain scientific concepts clearly with real-world examples.",
  history: "You are a history expert. Provide accurate historical context, dates, and help students understand the significance of events.",
  english: "You are an English language and literature expert. Help with grammar, writing, essay structure, and literary analysis.",
  programming: "You are a programming tutor. Help with coding concepts, debug issues, and explain algorithms clearly with examples.",
  languages: "You are a language learning tutor. Help with vocabulary, grammar, pronunciation tips, and cultural context.",
};

const VALID_SUBJECTS = ['general', 'math', 'science', 'history', 'english', 'programming', 'languages'];
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 10000;
const FREE_DAILY_LIMIT = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("[AI-CHAT] Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[AI-CHAT] User authenticated: ${user.id}`);

    // Check subscription status
    const checkSubResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/check-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
      }
    );

    let isPremium = false;
    if (checkSubResponse.ok) {
      const subData = await checkSubResponse.json();
      isPremium = subData.subscribed === true;
    }

    // Check and enforce usage limits for free users
    if (!isPremium) {
      const today = new Date().toISOString().split("T")[0];
      
      // Get or create today's usage record
      const { data: existingUsage, error: usageError } = await supabaseClient
        .from("ai_usage")
        .select("*")
        .eq("user_id", user.id)
        .eq("usage_date", today)
        .maybeSingle();

      if (usageError) {
        console.error("[AI-CHAT] Usage check error:", usageError.message);
      }

      const currentCount = existingUsage?.chat_messages_count ?? 0;

      if (currentCount >= FREE_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({ error: "Daily limit reached. Upgrade to premium for unlimited access." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update usage count
      if (existingUsage) {
        await supabaseClient
          .from("ai_usage")
          .update({ chat_messages_count: currentCount + 1 })
          .eq("id", existingUsage.id);
      } else {
        await supabaseClient
          .from("ai_usage")
          .insert({ user_id: user.id, usage_date: today, chat_messages_count: 1 });
      }

      console.log(`[AI-CHAT] Free user usage: ${currentCount + 1}/${FREE_DAILY_LIMIT}`);
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, subject = "general" } = body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages must be a non-empty array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: "Too many messages in conversation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object') {
        return new Response(
          JSON.stringify({ error: "Invalid message format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: "Invalid message role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof msg.content !== 'string' || msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: "Invalid message content" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate subject
    if (!VALID_SUBJECTS.includes(subject)) {
      return new Response(
        JSON.stringify({ error: "Invalid subject" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[AI-CHAT] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not available" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = SUBJECTS[subject as keyof typeof SUBJECTS] || SUBJECTS.general;
    
    console.log(`[AI-CHAT] Request - Subject: ${subject}, Messages: ${messages.length}, Premium: ${isPremium}`);

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI-CHAT] Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[AI-CHAT] Streaming response started");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[AI-CHAT] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
