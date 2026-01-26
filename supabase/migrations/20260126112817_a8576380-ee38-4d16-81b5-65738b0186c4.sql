-- Create study_sessions table for storing study blocks
CREATE TABLE public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Study Session',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  study_method TEXT NOT NULL DEFAULT 'review',
  break_interval_minutes INTEGER NOT NULL DEFAULT 25,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_deadlines table for tracking exams
CREATE TABLE public.exam_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  exam_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_deadlines ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_sessions
CREATE POLICY "Users can view their own study sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for exam_deadlines
CREATE POLICY "Users can view their own exam deadlines"
  ON public.exam_deadlines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exam deadlines"
  ON public.exam_deadlines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam deadlines"
  ON public.exam_deadlines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exam deadlines"
  ON public.exam_deadlines FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_study_sessions_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_exam_deadlines_updated_at
  BEFORE UPDATE ON public.exam_deadlines
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();