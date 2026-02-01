import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type SupportedFileType = 'pdf' | 'docx' | 'txt';

export function useFileParser() {
  const [isParsing, setIsParsing] = useState(false);
  const { toast } = useToast();

  const parseFile = useCallback(async (file: File): Promise<string | null> => {
    if (!file) return null;

    const fileType = getFileType(file);
    if (!fileType) {
      toast({
        variant: 'destructive',
        title: 'Unsupported file',
        description: 'Please upload a PDF, DOCX, or TXT file.',
      });
      return null;
    }

    setIsParsing(true);

    try {
      switch (fileType) {
        case 'txt':
          return await parseTxtFile(file);
        case 'pdf':
          return await parsePdfFile(file);
        case 'docx':
          return await parseDocxFile(file);
        default:
          return null;
      }
    } catch (error) {
      console.error('File parsing error:', error);
      toast({
        variant: 'destructive',
        title: 'Parsing failed',
        description: 'Could not extract text from the file. Please try again.',
      });
      return null;
    } finally {
      setIsParsing(false);
    }
  }, [toast]);

  return { parseFile, isParsing };
}

function getFileType(file: File): SupportedFileType | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;

  if (extension === 'pdf' || mimeType === 'application/pdf') return 'pdf';
  if (extension === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
  if (extension === 'txt' || mimeType === 'text/plain') return 'txt';

  return null;
}

async function parseTxtFile(file: File): Promise<string> {
  return await file.text();
}

async function parsePdfFile(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }
  
  return textParts.join('\n\n');
}

async function parseDocxFile(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
