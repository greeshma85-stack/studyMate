import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type SummaryLength = 'short' | 'medium' | 'detailed';

export type NoteSummary = {
  id: string;
  title: string;
  originalText: string;
  summary: string;
  summaryLength: SummaryLength;
  createdAt: Date;
};

export function useNoteSummarizer() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<NoteSummary | null>(null);
  const [summaries, setSummaries] = useState<NoteSummary[]>([]);
  const { session, user } = useAuth();
  const { toast } = useToast();

  const generateSummary = useCallback(async (
    text: string,
    length: SummaryLength = 'medium',
    title?: string
  ) => {
    if (!text.trim() || isGenerating) return null;

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('summarize-notes', {
        body: { text: text.trim(), length },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate summary');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const summary: NoteSummary = {
        id: crypto.randomUUID(),
        title: title || `Summary - ${new Date().toLocaleDateString()}`,
        originalText: text,
        summary: data.summary,
        summaryLength: length,
        createdAt: new Date(),
      };

      setCurrentSummary(summary);
      setSummaries(prev => [summary, ...prev]);

      // Save to database if user is authenticated
      if (user) {
        await supabase.from('note_summaries').insert({
          user_id: user.id,
          title: summary.title,
          original_text: summary.originalText,
          summary: summary.summary,
          summary_length: summary.summaryLength,
        });
      }

      toast({
        title: 'Summary Generated',
        description: 'Your notes have been summarized successfully.',
      });

      return summary;
    } catch (error) {
      console.error('Summarize error:', error);
      toast({
        variant: 'destructive',
        title: 'Summary Failed',
        description: error instanceof Error ? error.message : 'Failed to generate summary',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user, isGenerating, toast]);

  const regenerateSummary = useCallback(async (length?: SummaryLength) => {
    if (!currentSummary) return null;
    return generateSummary(
      currentSummary.originalText,
      length || currentSummary.summaryLength,
      currentSummary.title
    );
  }, [currentSummary, generateSummary]);

  const loadSummaries = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('note_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setSummaries(
        (data || []).map(s => ({
          id: s.id,
          title: s.title,
          originalText: s.original_text,
          summary: s.summary,
          summaryLength: s.summary_length as SummaryLength,
          createdAt: new Date(s.created_at),
        }))
      );
    } catch (error) {
      console.error('Failed to load summaries:', error);
    }
  }, [user]);

  const deleteSummary = useCallback(async (id: string) => {
    if (!user) return;

    try {
      await supabase.from('note_summaries').delete().eq('id', id).eq('user_id', user.id);
      setSummaries(prev => prev.filter(s => s.id !== id));
      if (currentSummary?.id === id) {
        setCurrentSummary(null);
      }
      toast({
        title: 'Summary Deleted',
        description: 'The summary has been removed.',
      });
    } catch (error) {
      console.error('Failed to delete summary:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete the summary.',
      });
    }
  }, [user, currentSummary, toast]);

  const clearCurrent = useCallback(() => {
    setCurrentSummary(null);
  }, []);

  return {
    isGenerating,
    currentSummary,
    summaries,
    generateSummary,
    regenerateSummary,
    loadSummaries,
    deleteSummary,
    clearCurrent,
    setCurrentSummary,
  };
}
