import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  CheckSquare,
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  LogOut,
  User,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_NAME } from '@/lib/constants';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: tasks = [] } = useTasks();
  const navigate = useNavigate();

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
    { icon: Plus, label: 'Add Task', href: '/tasks', color: 'text-primary' },
    { icon: Calendar, label: 'Study Planner', href: '/planner', color: 'text-info' },
    { icon: MessageSquare, label: 'AI Chat', href: '/chat', color: 'text-accent' },
    { icon: FileText, label: 'Notes', href: '/notes', color: 'text-warning' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-heading text-primary">{APP_NAME}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <section>
          <h2 className="text-2xl font-bold font-heading mb-1">
            Welcome back{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}! 👋
          </h2>
          <p className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Card className="hover:shadow-soft transition-shadow cursor-pointer">
                  <CardContent className="pt-6 text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-2`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <p className="font-medium text-sm">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

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
                <Button variant="link" onClick={() => navigate('/tasks')} className="mt-2">
                  Add a task
                </Button>
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
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
        <div className="flex justify-around py-2">
          <Link to="/dashboard" className="flex flex-col items-center p-2 text-primary">
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link to="/tasks" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
            <Target className="h-5 w-5" />
            <span className="text-xs mt-1">Tasks</span>
          </Link>
          <Link to="/planner" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
            <Calendar className="h-5 w-5" />
            <span className="text-xs mt-1">Planner</span>
          </Link>
          <Link to="/chat" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Chat</span>
          </Link>
          <Link to="/notes" className="flex flex-col items-center p-2 text-muted-foreground hover:text-primary">
            <FileText className="h-5 w-5" />
            <span className="text-xs mt-1">Notes</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
