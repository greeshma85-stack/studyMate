import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StudySession {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  start_time: string;
  end_time: string;
  study_method: 'review' | 'practice' | 'new_material';
  break_interval_minutes: number;
  notes?: string;
  is_completed: boolean;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExamDeadline {
  id: string;
  user_id: string;
  subject: string;
  title: string;
  exam_date: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

interface GeneratePlanParams {
  exams: ExamDeadline[];
  dailyStudyHours: number;
  preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  startDate: string;
  endDate: string;
}

export function useStudyPlanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch study sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['study-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as StudySession[];
    },
    enabled: !!user?.id,
  });

  // Fetch exam deadlines
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['exam-deadlines', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('exam_deadlines')
        .select('*')
        .eq('user_id', user.id)
        .order('exam_date', { ascending: true });
      
      if (error) throw error;
      return data as ExamDeadline[];
    },
    enabled: !!user?.id,
  });

  // Create study session
  const createSession = useMutation({
    mutationFn: async (session: Omit<StudySession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          ...session,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      toast({ title: 'Session created', description: 'Study session added to your schedule' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update study session
  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StudySession> & { id: string }) => {
      const { data, error } = await supabase
        .from('study_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete study session
  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      toast({ title: 'Deleted', description: 'Study session removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Create exam deadline
  const createExam = useMutation({
    mutationFn: async (exam: Omit<ExamDeadline, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('exam_deadlines')
        .insert({
          ...exam,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-deadlines'] });
      toast({ title: 'Exam added', description: 'Exam deadline saved' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Update exam deadline
  const updateExam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExamDeadline> & { id: string }) => {
      const { data, error } = await supabase
        .from('exam_deadlines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-deadlines'] });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Delete exam deadline
  const deleteExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_deadlines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-deadlines'] });
      toast({ title: 'Deleted', description: 'Exam deadline removed' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  // Generate AI study plan
  const generatePlan = async (params: GeneratePlanParams) => {
    if (!user?.id) throw new Error('Not authenticated');
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: params,
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Save generated sessions to database
      const sessionsToInsert = data.sessions.map((session: any) => ({
        ...session,
        user_id: user.id,
        is_completed: false,
        is_ai_generated: true,
      }));

      const { error: insertError } = await supabase
        .from('study_sessions')
        .insert(sessionsToInsert);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ['study-sessions'] });
      toast({ 
        title: 'Plan generated!', 
        description: `Created ${sessionsToInsert.length} study sessions` 
      });

      return data.sessions;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate plan';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle session completion
  const toggleSessionComplete = async (session: StudySession) => {
    await updateSession.mutateAsync({
      id: session.id,
      is_completed: !session.is_completed,
    });
  };

  return {
    sessions,
    exams,
    isLoading: sessionsLoading || examsLoading,
    isGenerating,
    createSession,
    updateSession,
    deleteSession,
    createExam,
    updateExam,
    deleteExam,
    generatePlan,
    toggleSessionComplete,
  };
}
