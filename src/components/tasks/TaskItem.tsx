import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import { Check, MoreHorizontal, Pencil, Trash2, Clock, BookOpen } from 'lucide-react';
import { Task, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const priorityColors = {
  low: 'bg-success/10 text-success border-success/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  high: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function TaskItem({ task, onEdit }: TaskItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();

  const isCompleted = task.status === 'completed';
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isCompleted;
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  const handleToggleComplete = async () => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        status: isCompleted ? 'pending' : 'completed',
      });
      toast({
        title: isCompleted ? 'Task reopened' : 'Task completed! 🎉',
        description: isCompleted ? 'Task marked as pending.' : 'Great job finishing this task!',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update task.',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync(task.id);
      toast({ title: 'Task deleted', description: 'The task has been removed.' });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task.',
      });
    }
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        className={cn(
          'group flex items-start gap-3 p-4 bg-card rounded-lg border border-border transition-all hover:shadow-soft',
          isCompleted && 'opacity-60'
        )}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleToggleComplete}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={cn(
                'font-medium text-foreground truncate',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            {task.subject && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {task.subject}
              </Badge>
            )}

            {task.due_date && (
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'bg-destructive/10 text-destructive border-destructive/20',
                  isDueToday && !isOverdue && 'bg-warning/10 text-warning border-warning/20'
                )}
              >
                <Clock className="h-3 w-3" />
                {isOverdue ? 'Overdue: ' : isDueToday ? 'Today: ' : ''}
                {format(new Date(task.due_date), 'MMM d')}
              </Badge>
            )}

            {isCompleted && task.completed_at && (
              <Badge variant="outline" className="flex items-center gap-1 bg-success/10 text-success border-success/20">
                <Check className="h-3 w-3" />
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{task.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
