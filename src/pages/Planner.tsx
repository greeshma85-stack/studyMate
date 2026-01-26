import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  Target,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useStudyPlanner, ExamDeadline } from '@/hooks/useStudyPlanner';
import { ExamDeadlineDialog } from '@/components/planner/ExamDeadlineDialog';
import { StudySessionDialog } from '@/components/planner/StudySessionDialog';
import { GeneratePlanDialog } from '@/components/planner/GeneratePlanDialog';
import { PlannerCalendar } from '@/components/planner/PlannerCalendar';

export default function Planner() {
  const {
    sessions,
    exams,
    isLoading,
    isGenerating,
    createSession,
    deleteSession,
    createExam,
    deleteExam,
    generatePlan,
    toggleSessionComplete,
  } = useStudyPlanner();

  const [showExamDialog, setShowExamDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Stats calculations
  const upcomingExams = exams.filter(
    (e) => new Date(e.exam_date) > new Date()
  ).length;
  const completedSessions = sessions.filter((s) => s.is_completed).length;
  const totalStudyHours = sessions.reduce((acc, s) => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);

  const handleCreateExam = async (exam: Omit<ExamDeadline, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    await createExam.mutateAsync(exam);
  };

  const handleCreateSession = async (session: any) => {
    await createSession.mutateAsync(session);
  };

  const handleGeneratePlan = async (params: any) => {
    await generatePlan(params);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6 space-y-6 pb-20 md:pb-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">Study Planner</h1>
            <p className="text-muted-foreground">
              Plan your study sessions and track your exams
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowExamDialog(true)}>
              <Target className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
            <Button variant="outline" onClick={() => setShowSessionDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
            <Button onClick={() => setShowGenerateDialog(true)} className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generate Plan
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingExams}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <BookOpen className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sessions.length}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStudyHours.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Study Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Calendar className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedSessions}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="exams">
              <Target className="h-4 w-4 mr-2" />
              Exam Deadlines
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            {sessions.length === 0 && exams.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No study sessions yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add exam deadlines and generate an AI-powered study plan
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowExamDialog(true)}>
                      <Target className="h-4 w-4 mr-2" />
                      Add Exam
                    </Button>
                    <Button onClick={() => setShowSessionDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PlannerCalendar
                sessions={sessions}
                exams={exams}
                onToggleComplete={toggleSessionComplete}
                onDeleteSession={(id) => deleteSession.mutate(id)}
              />
            )}
          </TabsContent>

          <TabsContent value="exams">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Exam Deadlines</CardTitle>
                <Button size="sm" onClick={() => setShowExamDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exam
                </Button>
              </CardHeader>
              <CardContent>
                {exams.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No exam deadlines added yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exams.map((exam) => {
                      const daysUntil = Math.ceil(
                        (new Date(exam.exam_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      const isPast = daysUntil < 0;
                      const isUrgent = daysUntil <= 3 && daysUntil >= 0;

                      return (
                        <div
                          key={exam.id}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg border',
                            isPast && 'opacity-50 bg-muted',
                            isUrgent && 'border-destructive/50 bg-destructive/5'
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'p-2 rounded-lg',
                                exam.priority === 'high' && 'bg-destructive/10',
                                exam.priority === 'medium' && 'bg-warning/10',
                                exam.priority === 'low' && 'bg-success/10'
                              )}
                            >
                              <Target
                                className={cn(
                                  'h-5 w-5',
                                  exam.priority === 'high' && 'text-destructive',
                                  exam.priority === 'medium' && 'text-warning',
                                  exam.priority === 'low' && 'text-success'
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-medium">{exam.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {exam.subject} • {format(new Date(exam.exam_date), 'PPP')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {isUrgent && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {daysUntil === 0 ? 'Today!' : `${daysUntil}d left`}
                              </Badge>
                            )}
                            {!isPast && !isUrgent && (
                              <Badge variant="outline">{daysUntil} days</Badge>
                            )}
                            {isPast && <Badge variant="secondary">Passed</Badge>}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteExam.mutate(exam.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ExamDeadlineDialog
        open={showExamDialog}
        onOpenChange={setShowExamDialog}
        onSubmit={handleCreateExam}
        isLoading={createExam.isPending}
      />
      <StudySessionDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        onSubmit={handleCreateSession}
        isLoading={createSession.isPending}
      />
      <GeneratePlanDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        onGenerate={handleGeneratePlan}
        exams={exams}
        isGenerating={isGenerating}
      />
    </MainLayout>
  );
}
