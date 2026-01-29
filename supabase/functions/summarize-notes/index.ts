import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LENGTH_PROMPTS = {
  short: "Create a very concise summary in 2-3 bullet points. Focus only on the most critical information.",
  medium: "Create a balanced summary with 5-7 bullet points covering the main concepts and key details.",
  detailed: "Create a comprehensive summary with 10-15 bullet points. Include main concepts, supporting details, definitions, and examples.",
};

const VALID_LENGTHS = ['short', 'medium', 'detailed'];
const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 100000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { text, length = "medium" } = body;
    
    // Validate text input
    if (typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: "Text must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.trim().length < MIN_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Please provide at least ${MIN_TEXT_LENGTH} characters of text to summarize.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text is too long. Maximum ${MAX_TEXT_LENGTH} characters allowed.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate length parameter
    if (!VALID_LENGTHS.includes(length)) {
      return new Response(
        JSON.stringify({ error: "Invalid summary length. Use 'short', 'medium', or 'detailed'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[SUMMARIZE] LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not available" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lengthInstruction = LENGTH_PROMPTS[length as keyof typeof LENGTH_PROMPTS] || LENGTH_PROMPTS.medium;
    
    console.log(`[SUMMARIZE] Request - Length: ${length}, Text length: ${text.length} chars`);

    const systemPrompt = `You are an expert study notes summarizer. Your job is to transform lengthy academic notes into clear, organized summaries that help students review and retain information effectively.

Guidelines:
- ${lengthInstruction}
- Use bullet points (•) for main points
- Highlight key terms and definitions
- Organize information logically
- Make the summary easy to scan and review
- Preserve accuracy of the original content
- Use clear, simple language`;

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
          { role: "user", content: `Please summarize the following notes:\n\n${text}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[SUMMARIZE] Gateway error:", response.status, errorText);
      
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

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Unable to generate summary.";
    
    console.log("[SUMMARIZE] Summary generated successfully");
    
    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[SUMMARIZE] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
