import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  'https://studymaate.lovable.app',
  'https://id-preview--23430868-0da0-4410-9fc1-64f01f2fa1cd.lovable.app',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface ExamDeadline {
  subject: string;
  title: string;
  exam_date: string;
  priority: string;
}

interface GeneratePlanRequest {
  exams: ExamDeadline[];
  dailyStudyHours: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  startDate: string;
  endDate: string;
}

const VALID_STUDY_TIMES = ['morning', 'afternoon', 'evening', 'night'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const MAX_EXAMS = 50;
const MAX_DAILY_HOURS = 16;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
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
      console.error("[STUDY-PLAN] Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[STUDY-PLAN] User authenticated: ${user.id}`);

    // Check subscription status - Study plan generation requires premium
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

    // AI Study Plan is a premium feature
    if (!isPremium) {
      return new Response(
        JSON.stringify({ error: "AI Study Plan generation is a premium feature. Please upgrade to access." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: GeneratePlanRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { exams, dailyStudyHours, preferredStudyTime, startDate, endDate } = body;

    // Validate exams array
    if (!Array.isArray(exams) || exams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one exam deadline is required to generate a plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (exams.length > MAX_EXAMS) {
      return new Response(
        JSON.stringify({ error: `Too many exams. Maximum ${MAX_EXAMS} allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate each exam
    for (const exam of exams) {
      if (!exam || typeof exam !== 'object') {
        return new Response(
          JSON.stringify({ error: 'Invalid exam format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof exam.subject !== 'string' || exam.subject.length === 0 || exam.subject.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Invalid exam subject' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof exam.title !== 'string' || exam.title.length === 0 || exam.title.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Invalid exam title' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (!exam.exam_date || isNaN(Date.parse(exam.exam_date))) {
        return new Response(
          JSON.stringify({ error: 'Invalid exam date' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (exam.priority && !VALID_PRIORITIES.includes(exam.priority)) {
        return new Response(
          JSON.stringify({ error: 'Invalid exam priority' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate dailyStudyHours
    if (typeof dailyStudyHours !== 'number' || dailyStudyHours < 1 || dailyStudyHours > MAX_DAILY_HOURS) {
      return new Response(
        JSON.stringify({ error: `Daily study hours must be between 1 and ${MAX_DAILY_HOURS}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate preferredStudyTime
    if (!VALID_STUDY_TIMES.includes(preferredStudyTime)) {
      return new Response(
        JSON.stringify({ error: 'Invalid preferred study time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dates
    if (!startDate || isNaN(Date.parse(startDate))) {
      return new Response(
        JSON.stringify({ error: 'Invalid start date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!endDate || isNaN(Date.parse(endDate))) {
      return new Response(
        JSON.stringify({ error: 'Invalid end date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (new Date(startDate) > new Date(endDate)) {
      return new Response(
        JSON.stringify({ error: 'Start date must be before end date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('[STUDY-PLAN] LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service is not available' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get study time slots based on preference
    const getTimeSlot = (preference: string) => {
      switch (preference) {
        case 'morning': return { start: '08:00', end: '12:00' };
        case 'afternoon': return { start: '13:00', end: '17:00' };
        case 'evening': return { start: '18:00', end: '22:00' };
        case 'night': return { start: '21:00', end: '01:00' };
        default: return { start: '09:00', end: '13:00' };
      }
    };

    const timeSlot = getTimeSlot(preferredStudyTime);

    const systemPrompt = `You are an expert study planner AI. Generate an optimized study schedule that:
1. Prioritizes subjects based on exam dates and priority levels
2. Uses the Pomodoro technique (25-minute work sessions with 5-minute breaks)
3. Distributes study time evenly across subjects
4. Allocates more time to high-priority exams
5. Includes breaks to prevent burnout

You must respond ONLY with a valid JSON array of study sessions. No other text.`;

    const userPrompt = `Create a study plan with these parameters:
- Exams: ${JSON.stringify(exams)}
- Daily study hours available: ${dailyStudyHours}
- Preferred study time: ${preferredStudyTime} (${timeSlot.start} to ${timeSlot.end})
- Plan period: ${startDate} to ${endDate}

Return a JSON array of study sessions with this exact structure:
[
  {
    "subject": "Subject Name",
    "title": "Session title describing what to study",
    "start_time": "2024-01-15T09:00:00Z",
    "end_time": "2024-01-15T10:00:00Z",
    "study_method": "review" | "practice" | "new_material",
    "break_interval_minutes": 25
  }
]

Create realistic sessions within the preferred time slots. Each session should be 45-90 minutes.
Ensure high-priority exams get more study sessions. Space out sessions for the same subject.`;

    console.log('[STUDY-PLAN] Calling AI to generate study plan...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STUDY-PLAN] Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Usage limit reached. Please upgrade your plan.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[STUDY-PLAN] No content in AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate study plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[STUDY-PLAN] AI response received, parsing...');

    // Parse the JSON response - extract JSON from markdown if needed
    let sessions;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      sessions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[STUDY-PLAN] Failed to parse AI response');
      return new Response(
        JSON.stringify({ error: 'Failed to generate study plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!Array.isArray(sessions)) {
      console.error('[STUDY-PLAN] AI response is not an array');
      return new Response(
        JSON.stringify({ error: 'Failed to generate study plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and clean up sessions
    const validatedSessions = sessions.map((session: any) => ({
      subject: String(session.subject || 'General'),
      title: String(session.title || 'Study Session'),
      start_time: session.start_time,
      end_time: session.end_time,
      study_method: ['review', 'practice', 'new_material'].includes(session.study_method) 
        ? session.study_method 
        : 'review',
      break_interval_minutes: Number(session.break_interval_minutes) || 25,
      is_ai_generated: true,
    }));

    console.log(`[STUDY-PLAN] Generated ${validatedSessions.length} study sessions for user ${user.id}`);

    return new Response(
      JSON.stringify({ sessions: validatedSessions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[STUDY-PLAN] Unexpected error:', error);
    const corsHeaders = getCorsHeaders(req.headers.get('origin'));
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});