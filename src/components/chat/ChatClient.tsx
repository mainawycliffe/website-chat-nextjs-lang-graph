'use client';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { Composer } from '@/components/chat/Composer';
import { MessageList } from '@/components/chat/MessageList';
import type { Message } from '@langchain/langgraph-sdk';
import { FetchStreamTransport, useStream } from '@langchain/langgraph-sdk/react';
import * as React from 'react';

const MAX_UI_MESSAGES = 60;

export function ChatClient() {
  const [input, setInput] = React.useState('');
  const [initialValues, setInitialValues] = React.useState<{ messages: Message[] }>({ messages: [] });

  const transport = React.useMemo(() => new FetchStreamTransport({ apiUrl: '/api/chat' }), []);

  const stream = useStream<{ messages: Message[] }>({
    transport,
    initialValues,
  });
  const isStreaming = stream.isLoading;

  const mainRef = React.useRef<HTMLElement | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const composerRef = React.useRef<HTMLElement | null>(null);
  const [composerHeight, setComposerHeight] = React.useState(0);
  const wasLoadingRef = React.useRef(false);

  React.useEffect(() => {
    const el = composerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setComposerHeight(el.getBoundingClientRect().height);
    });
    ro.observe(el);
    setComposerHeight(el.getBoundingClientRect().height);

    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    const end = endRef.current;
    if (!end) return;

    const raf = window.requestAnimationFrame(() => {
      end.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [stream.messages.length, stream.isLoading, composerHeight]);

  React.useEffect(() => {
    const wasLoading = wasLoadingRef.current;
    const isLoading = stream.isLoading;
    wasLoadingRef.current = isLoading;

    // Only sync after a run finishes, otherwise we can end up in a render loop
    // if `stream.messages` is a new array identity on each render.
    if (!wasLoading || isLoading) return;

    const messages = stream.messages.filter((m) => m.type === 'human' || m.type === 'ai').slice(-MAX_UI_MESSAGES);
    setInitialValues({ messages });
  }, [stream.isLoading, stream.messages]);

  React.useEffect(() => {
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
          ref={mainRef as React.RefObject<HTMLElement>}
          className='flex-1 overflow-y-auto'
          style={{
            paddingBottom: composerHeight ? composerHeight + 16 : 160,
            backgroundImage:
              'radial-gradient(900px circle at 10% 10%, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 55%), radial-gradient(800px circle at 95% 20%, color-mix(in oklab, var(--foreground) 5%, transparent), transparent 60%), radial-gradient(900px circle at 40% 95%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 55%)',
          }}>
          <MessageList messages={stream.messages} isStreaming={stream.isLoading} error={stream.error} />
          <div ref={endRef} />
        </main>

        <Composer
          containerRef={composerRef}
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
