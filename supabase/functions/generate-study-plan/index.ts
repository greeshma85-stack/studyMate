import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exams, dailyStudyHours, preferredStudyTime, startDate, endDate }: GeneratePlanRequest = await req.json();

    if (!exams || exams.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one exam deadline is required to generate a plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    console.log('Calling AI to generate study plan...');

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
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON response - extract JSON from markdown if needed
    let sessions;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      sessions = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!Array.isArray(sessions)) {
      throw new Error('AI response is not an array of sessions');
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

    console.log(`Generated ${validatedSessions.length} study sessions`);

    return new Response(
      JSON.stringify({ sessions: validatedSessions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating study plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate study plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
