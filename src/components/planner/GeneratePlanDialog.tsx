import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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
import { ExamDeadline } from '@/hooks/useStudyPlanner';

interface GeneratePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (params: {
    exams: ExamDeadline[];
    dailyStudyHours: number;
    preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
    startDate: string;
    endDate: string;
  }) => Promise<void>;
  exams: ExamDeadline[];
  isGenerating: boolean;
}

export function GeneratePlanDialog({
  open,
  onOpenChange,
  onGenerate,
  exams,
  isGenerating,
}: GeneratePlanDialogProps) {
  const [dailyStudyHours, setDailyStudyHours] = useState([3]);
  const [preferredStudyTime, setPreferredStudyTime] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('afternoon');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14));

  const handleGenerate = async () => {
    if (exams.length === 0) return;

    await onGenerate({
      exams,
      dailyStudyHours: dailyStudyHours[0],
      preferredStudyTime,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate AI Study Plan
          </DialogTitle>
          <DialogDescription>
            Create an optimized study schedule based on your exam deadlines and preferences.
          </DialogDescription>
        </DialogHeader>

        {exams.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              You need at least one exam deadline to generate a study plan.
            </p>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Add Exam First
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Exams to study for ({exams.length})</Label>
              <div className="flex flex-wrap gap-2">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium',
                      exam.priority === 'high' && 'bg-destructive/10 text-destructive',
                      exam.priority === 'medium' && 'bg-warning/10 text-warning-foreground',
                      exam.priority === 'low' && 'bg-success/10 text-success'
                    )}
                  >
                    {exam.subject} - {format(new Date(exam.exam_date), 'MMM d')}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Daily Study Hours</Label>
                <span className="text-sm font-medium text-primary">
                  {dailyStudyHours[0]} hours
                </span>
              </div>
              <Slider
                value={dailyStudyHours}
                onValueChange={setDailyStudyHours}
                min={1}
                max={8}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 2-4 hours for effective learning
              </p>
            </div>

            <div className="space-y-2">
              <Label>Preferred Study Time</Label>
              <Select value={preferredStudyTime} onValueChange={(v) => setPreferredStudyTime(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8 AM - 12 PM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (1 PM - 5 PM)</SelectItem>
                  <SelectItem value="evening">Evening (6 PM - 10 PM)</SelectItem>
                  <SelectItem value="night">Night (9 PM - 1 AM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => d && setStartDate(d)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => d && setEndDate(d)}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => date < startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Plan
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
