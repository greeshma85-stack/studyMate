import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, subWeeks, format, startOfDay, subDays, eachDayOfInterval } from 'date-fns';

export interface WeeklyStats {
  day: string;
  tasksCompleted: number;
  studyMinutes: number;
}

export interface SubjectDistribution {
  subject: string;
  count: number;
  fill: string;
}

export interface OverallStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  totalStudySessions: number;
  completedStudySessions: number;
  totalStudyMinutes: number;
  aiMessagesUsed: number;
  notesGenerated: number;
  currentStreak: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  'Math': 'hsl(217, 91%, 60%)',
  'Science': 'hsl(160, 84%, 39%)',
  'History': 'hsl(38, 92%, 50%)',
  'English': 'hsl(280, 84%, 60%)',
  'Physics': 'hsl(200, 84%, 50%)',
  'Chemistry': 'hsl(120, 60%, 45%)',
  'Biology': 'hsl(80, 70%, 45%)',
  'Geography': 'hsl(25, 80%, 55%)',
  'Literature': 'hsl(320, 70%, 55%)',
  'Other': 'hsl(0, 0%, 60%)',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || SUBJECT_COLORS['Other'];
}

export function useStudyStats() {
  const { data: overallStats, isLoading: isLoadingOverall } = useQuery({
    queryKey: ['study-stats-overall'],
    queryFn: async (): Promise<OverallStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all data in parallel
      const [tasksResult, sessionsResult, aiUsageResult, notesResult] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('study_sessions').select('*').eq('user_id', user.id),
        supabase.from('ai_usage').select('*').eq('user_id', user.id),
        supabase.from('note_summaries').select('id').eq('user_id', user.id),
      ]);

      const tasks = tasksResult.data || [];
      const sessions = sessionsResult.data || [];
      const aiUsage = aiUsageResult.data || [];
      const notes = notesResult.data || [];

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const pendingTasks = tasks.filter(t => t.status !== 'completed');
      const completedSessions = sessions.filter(s => s.is_completed);

      // Calculate total study minutes from sessions
      const totalStudyMinutes = sessions.reduce((acc, session) => {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        return acc + Math.round((end.getTime() - start.getTime()) / 60000);
      }, 0);

      // Calculate AI usage totals
      const aiMessagesUsed = aiUsage.reduce((acc, u) => acc + (u.chat_messages_count || 0), 0);

      // Calculate streak (consecutive days with completed tasks)
      let currentStreak = 0;
      const today = startOfDay(new Date());
      let checkDate = today;
      
      while (true) {
        const dayStr = format(checkDate, 'yyyy-MM-dd');
        const hasCompletedTask = completedTasks.some(t => {
          if (!t.completed_at) return false;
          return format(new Date(t.completed_at), 'yyyy-MM-dd') === dayStr;
        });
        
        if (hasCompletedTask) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        } else if (checkDate.getTime() === today.getTime()) {
          // Today might not have completed tasks yet, check yesterday
          checkDate = subDays(checkDate, 1);
        } else {
          break;
        }
      }

      return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        pendingTasks: pendingTasks.length,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
        totalStudySessions: sessions.length,
        completedStudySessions: completedSessions.length,
        totalStudyMinutes,
        aiMessagesUsed,
        notesGenerated: notes.length,
        currentStreak,
      };
    },
  });

  const { data: weeklyStats, isLoading: isLoadingWeekly } = useQuery({
    queryKey: ['study-stats-weekly'],
    queryFn: async (): Promise<WeeklyStats[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const [tasksResult, sessionsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekStart.toISOString())
          .lte('completed_at', weekEnd.toISOString()),
        supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('start_time', weekStart.toISOString())
          .lte('start_time', weekEnd.toISOString()),
      ]);

      const tasks = tasksResult.data || [];
      const sessions = sessionsResult.data || [];

      return days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayLabel = format(day, 'EEE');

        const dayTasks = tasks.filter(t => {
          if (!t.completed_at) return false;
          return format(new Date(t.completed_at), 'yyyy-MM-dd') === dayStr;
        });

        const daySessions = sessions.filter(s => {
          return format(new Date(s.start_time), 'yyyy-MM-dd') === dayStr;
        });

        const studyMinutes = daySessions.reduce((acc, session) => {
          const start = new Date(session.start_time);
          const end = new Date(session.end_time);
          return acc + Math.round((end.getTime() - start.getTime()) / 60000);
        }, 0);

        return {
          day: dayLabel,
          tasksCompleted: dayTasks.length,
          studyMinutes,
        };
      });
    },
  });

  const { data: subjectDistribution, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['study-stats-subjects'],
    queryFn: async (): Promise<SubjectDistribution[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tasks } = await supabase
        .from('tasks')
        .select('subject')
        .eq('user_id', user.id)
        .not('subject', 'is', null);

      if (!tasks || tasks.length === 0) return [];

      const subjectCounts: Record<string, number> = {};
      tasks.forEach(task => {
        const subject = task.subject || 'Other';
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      });

      return Object.entries(subjectCounts)
        .map(([subject, count]) => ({
          subject,
          count,
          fill: getSubjectColor(subject),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
    },
  });

  const { data: weeklyComparison } = useQuery({
    queryKey: ['study-stats-comparison'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const today = new Date();
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

      const [thisWeekTasks, lastWeekTasks] = await Promise.all([
        supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', thisWeekStart.toISOString()),
        supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', lastWeekStart.toISOString())
          .lte('completed_at', lastWeekEnd.toISOString()),
      ]);

      const thisWeekCount = thisWeekTasks.data?.length || 0;
      const lastWeekCount = lastWeekTasks.data?.length || 0;

      let percentChange = 0;
      if (lastWeekCount > 0) {
        percentChange = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
      } else if (thisWeekCount > 0) {
        percentChange = 100;
      }

      return {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
        percentChange,
      };
    },
  });

  return {
    overallStats,
    weeklyStats,
    subjectDistribution,
    weeklyComparison,
    isLoading: isLoadingOverall || isLoadingWeekly || isLoadingSubjects,
  };
}
