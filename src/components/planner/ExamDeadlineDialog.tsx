import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SUBJECT_CATEGORIES } from '@/lib/constants';
import { ExamDeadline } from '@/hooks/useStudyPlanner';

interface ExamDeadlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (exam: Omit<ExamDeadline, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  initialData?: ExamDeadline;
  isLoading?: boolean;
}

export function ExamDeadlineDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ExamDeadlineDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [examDate, setExamDate] = useState<Date | undefined>(
    initialData?.exam_date ? new Date(initialData.exam_date) : undefined
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    initialData?.priority || 'medium'
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !examDate) return;

    onSubmit({
      title,
      subject,
      exam_date: examDate.toISOString(),
      priority,
      notes: notes || undefined,
    });

    // Reset form
    setTitle('');
    setSubject('');
    setExamDate(undefined);
    setPriority('medium');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Exam Deadline' : 'Add Exam Deadline'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Exam Title</Label>
            <Input
              id="title"
              placeholder="e.g., Midterm Exam, Final Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_CATEGORIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Exam Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !examDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {examDate ? format(examDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={examDate}
                  onSelect={setExamDate}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the exam..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title || !subject || !examDate}>
              {isLoading ? 'Saving...' : initialData ? 'Update' : 'Add Exam'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
