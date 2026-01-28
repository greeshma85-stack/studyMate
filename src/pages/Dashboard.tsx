import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckSquare,
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { useSubscription, PLAN_DETAILS } from '@/hooks/useSubscription';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: tasks = [] } = useTasks();
  const { plan, isSubscribed } = useSubscription();

  const todaysTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return (
      dueDate.getDate() === today.getDate() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getFullYear() === today.getFullYear()
    );
  });

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedToday = todaysTasks.filter((t) => t.status === 'completed').length;
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)
    : 0;

  const quickActions = [
    { icon: Plus, label: 'Add Task', href: '/tasks', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Calendar, label: 'Study Planner', href: '/planner', color: 'text-info', bg: 'bg-info/10' },
    { icon: MessageSquare, label: 'AI Chat', href: '/chat', color: 'text-success', bg: 'bg-success/10' },
    { icon: FileText, label: 'Summarize Notes', href: '/notes', color: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-bold font-heading mb-1">
            Welcome back{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}! 👋
          </h2>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="animate-slide-up" style={{ animationDelay: '0ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingTasks.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">{todaysTasks.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Done Today</p>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action, index) => (
              <Link key={action.href} to={action.href}>
                <Card className="hover:shadow-soft hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                  <CardContent className="pt-6 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${action.bg} mb-2`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <p className="font-medium text-sm">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Subscription / AI Features Card */}
        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
          {isSubscribed ? (
            <Card className="gradient-primary text-primary-foreground overflow-hidden">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Crown className="h-10 w-10" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">Premium Active</h3>
                      <Badge variant="secondary" className="text-xs">
                        {PLAN_DETAILS[plan].name}
                      </Badge>
                    </div>
                    <p className="text-sm opacity-90">
                      Enjoy unlimited AI chat, notes, and advanced features
                    </p>
                  </div>
                  <Link to="/subscription">
                    <Button variant="secondary" size="sm">
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-accent/5 overflow-hidden">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Upgrade to Premium</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Unlock unlimited AI chat, notes summaries, and advanced planning
                    </p>
                  </div>
                  <Link to="/subscription">
                    <Button size="sm">
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Today's Tasks Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Today's Tasks</h3>
            <Link to="/tasks" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>

          {todaysTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No tasks due today</p>
                <Link to="/tasks">
                  <Button variant="link" className="mt-2">
                    Add a task
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todaysTasks.slice(0, 5).map((task) => (
                <Card key={task.id} className="hover:shadow-soft transition-shadow">
                  <CardContent className="py-3 flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.priority === 'high'
                          ? 'bg-destructive'
                          : task.priority === 'medium'
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                    />
                    <span
                      className={
                        task.status === 'completed'
                          ? 'line-through text-muted-foreground'
                          : ''
                      }
                    >
                      {task.title}
                    </span>
                    {task.subject && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {task.subject}
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Task Completion</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {tasks.filter((t) => t.status === 'completed').length} of {tasks.length} tasks completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
