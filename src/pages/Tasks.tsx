import { useState, useMemo } from 'react';
import { Plus, Filter, Search, CheckSquare, ListTodo, Loader2 } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskFormDialog } from '@/components/tasks/TaskFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUBJECT_CATEGORIES } from '@/lib/constants';

type FilterStatus = 'all' | 'pending' | 'completed';
type SortBy = 'created' | 'due_date' | 'priority';

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('created');

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((task) =>
        filterStatus === 'completed'
          ? task.status === 'completed'
          : task.status !== 'completed'
      );
    }

    // Subject filter
    if (filterSubject !== 'all') {
      filtered = filtered.filter((task) => task.subject === filterSubject);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [tasks, searchQuery, filterStatus, filterSubject, sortBy]);

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTask(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading">Tasks</h1>
              <p className="text-sm text-muted-foreground">
                {pendingCount} pending, {completedCount} completed
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {SUBJECT_CATEGORIES.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest</SelectItem>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Tabs */}
        <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <ListTodo className="h-4 w-4" />
              All ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              Pending ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Completed ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <CheckSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">
              {searchQuery || filterStatus !== 'all' || filterSubject !== 'all'
                ? 'No matching tasks'
                : 'No tasks yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterStatus !== 'all' || filterSubject !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterSubject === 'all' && (
              <Button onClick={() => setDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </main>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        task={editingTask}
      />
    </div>
  );
}
