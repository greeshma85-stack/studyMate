import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Clock,
  MessageSquare,
  FileText,
  Flame,
  Target,
  Crown,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudyStats } from '@/hooks/useStudyStats';
import { useSubscription } from '@/hooks/useSubscription';

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: number;
  color?: 'primary' | 'success' | 'warning' | 'info';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <Card className="animate-slide-up">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(trend)}% vs last week</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { overallStats, weeklyStats, subjectDistribution, weeklyComparison, isLoading } = useStudyStats();
  const { isSubscribed } = useSubscription();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold font-heading mb-6">Analytics</h1>
          <LoadingSkeleton />
        </div>
      </MainLayout>
    );
  }

  // Premium gate for analytics
  if (!isSubscribed) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold font-heading mb-6">Analytics</h1>
          
          <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 animate-fade-in">
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Unlock Analytics</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get detailed insights into your study habits, task completion rates, and productivity trends with Premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/subscription">
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>

              {/* Preview of what's available */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-50 blur-sm pointer-events-none">
                <div className="p-4 bg-card rounded-lg">
                  <p className="text-2xl font-bold">15</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </div>
                <div className="p-4 bg-card rounded-lg">
                  <p className="text-2xl font-bold">4.5h</p>
                  <p className="text-xs text-muted-foreground">Study Time</p>
                </div>
                <div className="p-4 bg-card rounded-lg">
                  <p className="text-2xl font-bold">87%</p>
                  <p className="text-xs text-muted-foreground">Completion</p>
                </div>
                <div className="p-4 bg-card rounded-lg">
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const stats = overallStats || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    totalStudySessions: 0,
    completedStudySessions: 0,
    totalStudyMinutes: 0,
    aiMessagesUsed: 0,
    notesGenerated: 0,
    currentStreak: 0,
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-heading">Analytics</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-warning" />
            <span>{stats.currentStreak} day streak</span>
          </div>
        </div>

        {/* Overview Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Tasks Completed"
            value={stats.completedTasks}
            icon={CheckSquare}
            description={`${stats.pendingTasks} pending`}
            trend={weeklyComparison?.percentChange}
            color="success"
          />
          <StatCard
            title="Study Time"
            value={formatStudyTime(stats.totalStudyMinutes)}
            icon={Clock}
            description={`${stats.totalStudySessions} sessions`}
            color="primary"
          />
          <StatCard
            title="AI Messages"
            value={stats.aiMessagesUsed}
            icon={MessageSquare}
            color="info"
          />
          <StatCard
            title="Notes Created"
            value={stats.notesGenerated}
            icon={FileText}
            color="warning"
          />
        </section>

        {/* Charts Row */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Weekly Activity Chart */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Weekly Activity</CardTitle>
              <CardDescription>Tasks completed and study time this week</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyStats && weeklyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                    <Bar
                      dataKey="tasksCompleted"
                      name="Tasks"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="studyMinutes"
                      name="Study (min)"
                      fill="hsl(var(--success))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <p>No activity data this week yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Distribution */}
          <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-lg">Subject Focus</CardTitle>
              <CardDescription>Tasks distribution by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectDistribution && subjectDistribution.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie
                        data={subjectDistribution}
                        dataKey="count"
                        nameKey="subject"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {subjectDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {subjectDistribution.map((item) => (
                      <div key={item.subject} className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                        <span className="flex-1 truncate">{item.subject}</span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <p>Add subjects to your tasks to see distribution</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Completion Progress */}
        <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Task Completion Rate</span>
                <span className="font-medium">{stats.completionRate}%</span>
              </div>
              <Progress value={stats.completionRate} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedTasks} of {stats.totalTasks} tasks completed
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Study Sessions Completed</span>
                <span className="font-medium">
                  {stats.totalStudySessions > 0
                    ? Math.round((stats.completedStudySessions / stats.totalStudySessions) * 100)
                    : 0}%
                </span>
              </div>
              <Progress
                value={
                  stats.totalStudySessions > 0
                    ? (stats.completedStudySessions / stats.totalStudySessions) * 100
                    : 0
                }
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedStudySessions} of {stats.totalStudySessions} sessions completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm font-medium">Most Productive Day</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {weeklyStats && weeklyStats.length > 0
                    ? (() => {
                        const maxDay = weeklyStats.reduce((max, day) =>
                          day.tasksCompleted > max.tasksCompleted ? day : max
                        );
                        return maxDay.tasksCompleted > 0
                          ? `${maxDay.day} with ${maxDay.tasksCompleted} tasks`
                          : 'No completed tasks yet';
                      })()
                    : 'Not enough data yet'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-success/5 border border-success/10">
                <p className="text-sm font-medium">Average Daily Study</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {stats.totalStudyMinutes > 0
                    ? formatStudyTime(Math.round(stats.totalStudyMinutes / 7))
                    : '0m'}{' '}
                  per day this week
                </p>
              </div>
              <div className="p-4 rounded-lg bg-warning/5 border border-warning/10">
                <p className="text-sm font-medium">AI Assistance</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {stats.aiMessagesUsed} messages & {stats.notesGenerated} notes generated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
