import type { Message } from '@langchain/langgraph-sdk';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { getTextContent } from '@/components/chat/getTextContent';

type MessageBubbleProps = {
  message: Message;
  showStreamingCursor: boolean;
};

export function MessageBubble({ message, showStreamingCursor }: MessageBubbleProps) {
  const isUser = message.type === 'human';
  const bubbleClass = isUser
    ? 'ml-auto rounded-2xl rounded-br-md text-background vibrant-bubble vibrant-bubble-user'
    : 'mr-auto rounded-2xl rounded-bl-md text-foreground vibrant-bubble vibrant-bubble-ai';

  const text = getTextContent(message.content);

  return (
    <div className='border-b border-foreground/10'>
      <div className='px-4 py-6'>
        <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
          <div className={`w-fit max-w-[82%] px-4 py-3 text-sm leading-6 ${bubbleClass}`}>
            {isUser ? (
              <p className='whitespace-pre-wrap'>{text}</p>
            ) : text ? (
              <div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ children, ...props }) => (
                      <a
                        {...props}
                        target='_blank'
                        rel='noreferrer'
                        className='underline underline-offset-2'
                        style={{ color: 'var(--link)' }}>
                        {children}
                      </a>
                    ),
                    pre: ({ children, ...props }) => (
                      <pre
                        {...props}
                        className='mt-2 overflow-x-auto rounded-md border border-foreground/15 bg-foreground/5 p-3'>
                        {children}
                      </pre>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isBlock = typeof className === 'string' && className.includes('language-');
                      if (isBlock) {
                        return (
                          <code {...props} className={className}>
                            {children}
                          </code>
                        );
                      }

                      return (
                        <code {...props} className='rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.9em]'>
                          {children}
                        </code>
                      );
                    },
                    ul: ({ children, ...props }) => (
                      <ul {...props} className='my-2 list-disc pl-5'>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol {...props} className='my-2 list-decimal pl-5'>
                        {children}
                      </ol>
                    ),
                    p: ({ children, ...props }) => (
                      <p {...props} className='my-2'>
                        {children}
                      </p>
                    ),
                  }}>
                  {text}
                </ReactMarkdown>

                {showStreamingCursor ? (
                  <span className='ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-foreground/60 align-middle shadow-[0_0_0_1px_color-mix(in_oklab,var(--foreground)_20%,transparent)]' />
                ) : null}
              </div>
            ) : (
              <p className='text-sm text-foreground/60'>Thinking…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
