import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAIChat, Subject, ChatMessage } from '@/hooks/useAIChat';
import { useVoiceInput, useTextToSpeech } from '@/hooks/useVoiceInput';
import { Send, Trash2, Loader2, Bot, User, Sparkles, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUBJECTS: { value: Subject; label: string; icon: string }[] = [
  { value: 'general', label: 'General', icon: '💬' },
  { value: 'math', label: 'Mathematics', icon: '🔢' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'history', label: 'History', icon: '📜' },
  { value: 'english', label: 'English', icon: '📚' },
  { value: 'programming', label: 'Programming', icon: '💻' },
  { value: 'languages', label: 'Languages', icon: '🌍' },
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">AI Study Assistant</h2>
        <p className="text-muted-foreground mb-4">
          Ask me anything about your studies! I can help with math problems, science concepts,
          history questions, programming, and more.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {['Explain photosynthesis', 'Solve x² + 5x + 6 = 0', 'What caused WW1?'].map((q) => (
            <span key={q} className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
              "{q}"
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { messages, isLoading, subject, setSubject, sendMessage, clearMessages } = useAIChat();
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useVoiceInput();
  const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update input when voice transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
      resetTranscript();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSpeakLastResponse = () => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMessage) {
      if (isSpeaking) {
        stopSpeaking();
      } else {
        speak(lastAssistantMessage.content);
      }
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">AI Study Chat</h1>
              <p className="text-xs text-muted-foreground">
                {SUBJECTS.find(s => s.value === subject)?.icon}{' '}
                {SUBJECTS.find(s => s.value === subject)?.label} mode
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearMessages} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="max-w-3xl mx-auto">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-background">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask me anything about your studies..."}
              disabled={isLoading}
              className={cn("flex-1", isListening && "border-primary ring-2 ring-primary/20")}
            />
            {isSupported && (
              <Button 
                type="button" 
                variant={isListening ? "destructive" : "outline"} 
                size="icon"
                onClick={toggleVoice}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            )}
            {messages.some(m => m.role === 'assistant') && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSpeakLastResponse}
                title={isSpeaking ? "Stop speaking" : "Read last response"}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            )}
            <Button type="submit" disabled={!input.trim() || isLoading} className="gradient-primary">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
