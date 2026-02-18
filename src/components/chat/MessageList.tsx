import type { Message } from '@langchain/langgraph-sdk';

import { EmptyAssistantHint } from '@/components/chat/EmptyAssistantHint';
import { MessageBubble } from '@/components/chat/MessageBubble';

type MessageListProps = {
  messages: Message[];
  isStreaming: boolean;
  error: unknown;
};

export function MessageList({ messages, isStreaming, error }: MessageListProps) {
  return (
    <div className='flex flex-col max-w-4xl mx-auto'>
      {messages.length === 0 ? <EmptyAssistantHint /> : null}

      {messages
        .filter((m) => m.type === 'human' || m.type === 'ai')
        .map((m, idx, arr) => {
          const isLast = idx === arr.length - 1;
          const showStreamingCursor = isStreaming && isLast && m.type === 'ai';
          return <MessageBubble key={m.id ?? idx} message={m} showStreamingCursor={showStreamingCursor} />;
        })}

      {error ? (
        <div className='border-b border-foreground/10'>
          <div className='px-4 py-6'>
            <div className='flex justify-start'>
              <div className='w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-background px-4 py-3 text-sm leading-6 text-red-600 shadow-sm'>
                {error instanceof Error ? error.message : 'Something went wrong.'}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
