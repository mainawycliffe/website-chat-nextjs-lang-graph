'use client';

import type { Message } from '@langchain/langgraph-sdk';
import { FetchStreamTransport, useStream } from '@langchain/langgraph-sdk/react';
import * as React from 'react';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import { useEffect } from 'react';

export function ChatClient() {
  const [input, setInput] = React.useState('');

  const transport = React.useMemo(() => new FetchStreamTransport({ apiUrl: '/api/chat' }), []);
  const stream = useStream<{ messages: Message[] }>({ transport });
  const isStreaming = stream.isLoading;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [stream.messages, stream.isLoading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, 180);
    el.style.height = `${next}px`;
  }, [input]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || stream.isLoading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    stream.submit(
      { messages: [{ type: 'human', content: trimmed }] },
      {
        optimisticValues(prev: { messages?: Message[] }) {
          const prevMessages = prev.messages ?? [];
          return {
            ...prev,
            messages: [...prevMessages, { id: `human:${Date.now()}`, type: 'human', content: trimmed }],
          };
        },
      },
    );
  }

  function requestSend() {
    if (stream.isLoading) return;
    if (!input.trim()) return;
    submit();
  }

  function stop() {
    stream.stop();
  }

  return (
    <div className='min-h-screen vibrant-panel'>
      <div className='mx-auto flex min-h-screen w-full flex-col'>
        <ChatHeader isStreaming={isStreaming} onStop={stop} />

        <main
          className='flex-1 overflow-y-auto'
          style={{
            backgroundImage:
              'radial-gradient(900px circle at 10% 10%, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 55%), radial-gradient(800px circle at 95% 20%, color-mix(in oklab, var(--foreground) 5%, transparent), transparent 60%), radial-gradient(900px circle at 40% 95%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 55%)',
          }}>
          <MessageList
            messages={stream.messages}
            isStreaming={stream.isLoading}
            error={stream.error}
            scrollRef={scrollRef}
          />
        </main>

        <Composer
          input={input}
          setInput={setInput}
          isStreaming={stream.isLoading}
          onSubmit={submit}
          onRequestSend={requestSend}
          textareaRef={textareaRef}
        />
      </div>
    </div>
  );
}
