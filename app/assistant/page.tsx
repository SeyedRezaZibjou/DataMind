
'use client';

import { buildDatasetContext } from '@/lib/ai/build-context';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  Send,
  Bot,
  User,
  Info,
  Database,
  Hash,
  Type as TypeIcon,
  Loader2,
} from 'lucide-react';

import { useI18n } from '@/components/providers/i18n-provider';
import { useDataset } from '@/components/providers/dataset-provider';
import { PageHeader, EmptyState } from '@/components/shared/page-components';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantPage() {
  const { t } = useI18n();
  const { dataset, overview, quality } = useDataset();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!dataset || !overview || !quality) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t.assistant.title}
          subtitle={t.assistant.subtitle}
        />

        <EmptyState
          icon={Sparkles}
          title={t.assistant.title}
          description={t.assistant.contextEmpty}
          action={
            <Link href="/upload">
              <Button className="gap-2">
                <Upload className="h-4 w-4" />
                {t.dashboard.uploadDataset}
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const suggestions = [
    t.assistant.suggestion1,
    t.assistant.suggestion2,
    t.assistant.suggestion3,
    t.assistant.suggestion4,
    t.assistant.suggestion5,
    t.assistant.suggestion6,
  ];

  // Send a message to the Groq API
  const send = async (text: string) => {
    const message = text.trim();

    if (!message || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const context = buildDatasetContext(
        dataset,
        overview,
        quality,
      );

      const history = messages.slice(-4).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to get AI response.'
        );
      }

      if (
        typeof data.reply !== 'string' ||
        !data.reply.trim()
      ) {
        throw new Error('The AI returned an empty response.');
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Assistant error:', error);

      const errorMessage: Message = {
        id: `e-${Date.now()}`,
        role: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const typeCounts = overview.columns.reduce(
    (acc, c) => {
      acc[c.type] = (acc[c.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.assistant.title}
        subtitle={t.assistant.subtitle}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-[600px] flex-col">
            {/* Chat Header */}
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {t.assistant.assistantName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isLoading ? 'Thinking...' : 'Groq AI'}
                </p>
              </div>

              <Badge
                variant="outline"
                className="ms-auto gap-1 text-[11px]"
              >
                <Info className="h-3 w-3" />
                Groq AI
              </Badge>
            </div>

            {/* Chat Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-7 w-7" />
                  </div>

                  <div>
                    <p className="font-medium">
                      {t.assistant.noHistory}
                    </p>
                  </div>

                  <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s)}
                        disabled={isLoading}
                        className="rounded-lg border border-border p-3 text-start text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-3 animate-fade-in',
                        msg.role === 'user' ? 'flex-row-reverse' : '',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {msg.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <div
                        className={cn(
                          'max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground',
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Bot className="h-4 w-4" />
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  disabled={isLoading}
                  placeholder={t.assistant.placeholder}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />

                <Button
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => send(input)}
                  disabled={!input.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 rtl:rotate-180" />
                  )}
                </Button>
              </div>

              <p className="mt-2 px-1 text-[11px] text-muted-foreground">
                {t.assistant.disclaimer}
              </p>
            </div>
          </Card>
        </div>

        {/* Dataset Context */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">
                {t.assistant.context}
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t.assistant.contextShape}
                </span>

                <span className="font-medium tabular-nums">
                  {overview.rowCount.toLocaleString()} × {overview.columnCount}
                </span>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t.assistant.contextColumns}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {dataset.columns.slice(0, 8).map((col) => (
                    <Badge
                      key={col}
                      variant="outline"
                      className="text-[11px] font-normal"
                    >
                      {col}
                    </Badge>
                  ))}

                  {dataset.columns.length > 8 && (
                    <Badge
                      variant="outline"
                      className="text-[11px] font-normal"
                    >
                      +{dataset.columns.length - 8}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t.assistant.contextTypes}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(typeCounts).map(([type, count]) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="gap-1 text-[11px]"
                    >
                      {type === 'numeric' && (
                        <Hash className="h-3 w-3" />
                      )}

                      {type === 'categorical' && (
                        <TypeIcon className="h-3 w-3" />
                      )}

                      {t.common[type as keyof typeof t.common] ?? type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Suggested Questions */}
          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-sm">
              {t.assistant.suggested}
            </h3>

            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-border p-2.5 text-start text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
