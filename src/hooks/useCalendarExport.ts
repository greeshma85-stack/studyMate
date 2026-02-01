import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export function useCalendarExport() {
  const { toast } = useToast();

  const formatICSDate = useCallback((date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss");
  }, []);

  const generateICS = useCallback((events: CalendarEvent[]): string => {
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//StudyMate//Study Sessions//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach((event, index) => {
      const uid = `studymate-${Date.now()}-${index}@studymate.app`;
      const dtstamp = formatICSDate(new Date());
      
      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${formatICSDate(event.startTime)}`,
        `DTEND:${formatICSDate(event.endTime)}`,
        `SUMMARY:${escapeICSText(event.title)}`,
      );

      if (event.description) {
        icsLines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
      }

      if (event.location) {
        icsLines.push(`LOCATION:${escapeICSText(event.location)}`);
      }

      // Add reminder 15 minutes before
      icsLines.push(
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICSText(event.title)} starting soon`,
        'END:VALARM',
      );

      icsLines.push('END:VEVENT');
    });

    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
  }, [formatICSDate]);

  const downloadICS = useCallback((events: CalendarEvent[], filename = 'study-sessions.ics') => {
    if (events.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No events',
        description: 'There are no events to export.',
      });
      return;
    }

    const icsContent = generateICS(events);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Calendar Exported',
      description: `${events.length} event(s) exported to ${filename}`,
    });
  }, [generateICS, toast]);

  const exportSingleEvent = useCallback((event: CalendarEvent) => {
    downloadICS([event], `${event.title.replace(/\s+/g, '-').toLowerCase()}.ics`);
  }, [downloadICS]);

  const exportMultipleEvents = useCallback((events: CalendarEvent[]) => {
    downloadICS(events, 'study-sessions.ics');
  }, [downloadICS]);

  return {
    exportSingleEvent,
    exportMultipleEvents,
    generateICS,
  };
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
