import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNoteSummarizer, SummaryLength, NoteSummary } from '@/hooks/useNoteSummarizer';
import { useFileParser } from '@/hooks/useFileParser';
import { 
  FileText, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Trash2, 
  Download,
  Clock,
  ChevronRight,
  Upload,
  File,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const LENGTH_OPTIONS: { value: SummaryLength; label: string; description: string }[] = [
  { value: 'short', label: 'Short', description: '2-3 key points' },
  { value: 'medium', label: 'Medium', description: '5-7 main concepts' },
  { value: 'detailed', label: 'Detailed', description: '10-15 comprehensive points' },
];

const MAX_TEXT_LENGTH = 100000;

function SummaryCard({ summary, onSelect, onDelete }: { 
  summary: NoteSummary; 
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors group"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{summary.title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {format(summary.createdAt, 'MMM d, yyyy')}
              <span className="mx-1">•</span>
              {summary.summaryLength}
            </p>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {summary.summary.slice(0, 100)}...
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotesPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [length, setLength] = useState<SummaryLength>('medium');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { parseFile, isParsing } = useFileParser();

  const {
    isGenerating,
    currentSummary,
    summaries,
    generateSummary,
    regenerateSummary,
    loadSummaries,
    deleteSummary,
    clearCurrent,
    setCurrentSummary,
  } = useNoteSummarizer();

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    const extractedText = await parseFile(file);
    if (extractedText) {
      if (extractedText.length > MAX_TEXT_LENGTH) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `Extracted text is ${extractedText.length.toLocaleString()} characters. Maximum allowed is ${MAX_TEXT_LENGTH.toLocaleString()}. Text has been truncated.`,
        });
        setText(extractedText.slice(0, MAX_TEXT_LENGTH));
      } else {
        setText(extractedText);
        toast({
          title: 'File processed',
          description: `Extracted ${extractedText.length.toLocaleString()} characters from ${file.name}`,
        });
      }
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    setUploadedFile(file);
    const extractedText = await parseFile(file);
    if (extractedText) {
      if (extractedText.length > MAX_TEXT_LENGTH) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `Extracted text is ${extractedText.length.toLocaleString()} characters. Maximum allowed is ${MAX_TEXT_LENGTH.toLocaleString()}. Text has been truncated.`,
        });
        setText(extractedText.slice(0, MAX_TEXT_LENGTH));
      } else {
        setText(extractedText);
        toast({
          title: 'File processed',
          description: `Extracted ${extractedText.length.toLocaleString()} characters from ${file.name}`,
        });
      }
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (text.trim().length < 50) {
      toast({
        variant: 'destructive',
        title: 'Text too short',
        description: 'Please enter at least 50 characters to summarize.',
      });
      return;
    }
    if (text.length > MAX_TEXT_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Text too long',
        description: `Maximum ${MAX_TEXT_LENGTH.toLocaleString()} characters allowed. Your text has ${text.length.toLocaleString()} characters.`,
      });
      return;
    }
    await generateSummary(text, length, title || undefined);
  };

  const handleCopy = () => {
    if (currentSummary) {
      navigator.clipboard.writeText(currentSummary.summary);
      toast({ title: 'Copied', description: 'Summary copied to clipboard.' });
    }
  };

  const handleDownload = () => {
    if (currentSummary) {
      const blob = new Blob([currentSummary.summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSummary.title.replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSelectSummary = (summary: NoteSummary) => {
    setCurrentSummary(summary);
    setText(summary.originalText);
    setTitle(summary.title);
    setLength(summary.summaryLength);
    setActiveTab('create');
  };

  const isTextTooLong = text.length > MAX_TEXT_LENGTH;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            AI Notes Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Transform lengthy notes into concise, study-ready summaries
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'history')}>
          <TabsList className="mb-6">
            <TabsTrigger value="create" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Create Summary
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History ({summaries.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (optional)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Biology Chapter 5 Notes"
                    />
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <Label>Upload Document (Optional)</Label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-primary/50",
                        isParsing && "opacity-50 pointer-events-none",
                        uploadedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {isParsing ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Processing file...</p>
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <File className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">{uploadedFile.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Drag & drop or click to upload
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Supports PDF, DOCX, TXT
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Or paste your notes</Label>
                    <Textarea
                      id="notes"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste your study notes here... (minimum 50 characters)"
                      className="min-h-[200px] resize-none"
                    />
                    <p className={cn(
                      "text-xs text-right",
                      isTextTooLong ? "text-destructive font-medium" : "text-muted-foreground"
                    )}>
                      {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} characters
                      {isTextTooLong && " (too long!)"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Summary Length</Label>
                    <Select value={length} onValueChange={(v) => setLength(v as SummaryLength)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LENGTH_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex flex-col">
                              <span className="font-medium">{opt.label}</span>
                              <span className="text-xs text-muted-foreground">{opt.description}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || isParsing || text.trim().length < 50 || isTextTooLong}
                    className="w-full gradient-primary"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card className={cn(!currentSummary && 'opacity-60')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg">Summary</CardTitle>
                  {currentSummary && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => regenerateSummary()}
                        disabled={isGenerating}
                        title="Regenerate"
                      >
                        <RefreshCw className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {currentSummary ? (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <h3 className="text-base font-semibold mb-3">{currentSummary.title}</h3>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {currentSummary.summary}
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-[400px] flex items-center justify-center text-center">
                      <div>
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">
                          Your summary will appear here
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Paste your notes and click "Generate Summary"
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            {summaries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No summaries yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate your first summary to see it here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaries.map((summary) => (
                  <SummaryCard
                    key={summary.id}
                    summary={summary}
                    onSelect={() => handleSelectSummary(summary)}
                    onDelete={() => deleteSummary(summary.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
