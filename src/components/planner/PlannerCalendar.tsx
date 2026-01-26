import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday,
  parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check, Clock, BookOpen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StudySession, ExamDeadline } from '@/hooks/useStudyPlanner';

interface PlannerCalendarProps {
  sessions: StudySession[];
  exams: ExamDeadline[];
  onToggleComplete: (session: StudySession) => void;
  onDeleteSession: (id: string) => void;
  onSessionClick?: (session: StudySession) => void;
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  Physics: 'bg-purple-500/10 text-purple-700 border-purple-500/30',
  Chemistry: 'bg-green-500/10 text-green-700 border-green-500/30',
  Biology: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  History: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  Geography: 'bg-teal-500/10 text-teal-700 border-teal-500/30',
  Literature: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
  'Computer Science': 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30',
  Economics: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  Psychology: 'bg-pink-500/10 text-pink-700 border-pink-500/30',
  Languages: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
  Art: 'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/30',
  Music: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  Other: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
};

export function PlannerCalendar({
  sessions,
  exams,
  onToggleComplete,
  onDeleteSession,
  onSessionClick,
}: PlannerCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const getSessionsForDay = (day: Date) => {
    return sessions.filter((session) =>
      isSameDay(parseISO(session.start_time), day)
    );
  };

  const getExamsForDay = (day: Date) => {
    return exams.filter((exam) =>
      isSameDay(parseISO(exam.exam_date), day)
    );
  };

  const getSubjectColor = (subject: string) => {
    return SUBJECT_COLORS[subject] || SUBJECT_COLORS['Other'];
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Week Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-semibold text-lg">
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Day Headers */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'p-2 text-center border-b border-r border-border last:border-r-0',
              isToday(day) && 'bg-primary/5'
            )}
          >
            <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
            <p
              className={cn(
                'text-lg font-semibold',
                isToday(day) && 'text-primary'
              )}
            >
              {format(day, 'd')}
            </p>
          </div>
        ))}

        {/* Day Content */}
        {weekDays.map((day) => {
          const daySessions = getSessionsForDay(day);
          const dayExams = getExamsForDay(day);

          return (
            <div
              key={`content-${day.toISOString()}`}
              className={cn(
                'min-h-[180px] p-2 border-r border-border last:border-r-0',
                isToday(day) && 'bg-primary/5'
              )}
            >
              <ScrollArea className="h-[170px]">
                <div className="space-y-1">
                  {/* Exam badges */}
                  {dayExams.map((exam) => (
                    <div
                      key={exam.id}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium border',
                        exam.priority === 'high' && 'bg-destructive/10 text-destructive border-destructive/30',
                        exam.priority === 'medium' && 'bg-warning/10 text-warning-foreground border-warning/30',
                        exam.priority === 'low' && 'bg-success/10 text-success border-success/30'
                      )}
                    >
                      📚 {exam.title}
                    </div>
                  ))}

                  {/* Study sessions */}
                  {daySessions.map((session) => (
                    <Tooltip key={session.id}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => onSessionClick?.(session)}
                          className={cn(
                            'px-2 py-1.5 rounded text-xs cursor-pointer border transition-all hover:shadow-sm',
                            getSubjectColor(session.subject),
                            session.is_completed && 'opacity-60 line-through'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{format(parseISO(session.start_time), 'HH:mm')}</span>
                          </div>
                          <p className="font-medium truncate mt-0.5">{session.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {session.subject}
                            </Badge>
                            <div className="flex gap-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleComplete(session);
                                }}
                              >
                                <Check
                                  className={cn(
                                    'h-3 w-3',
                                    session.is_completed && 'text-success'
                                  )}
                                />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(session.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px]">
                        <p className="font-medium">{session.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(session.start_time), 'h:mm a')} -{' '}
                          {format(parseISO(session.end_time), 'h:mm a')}
                        </p>
                        <p className="text-xs mt-1">Method: {session.study_method}</p>
                        {session.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{session.notes}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}

                  {daySessions.length === 0 && dayExams.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No sessions
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
    </div>
  );
}
