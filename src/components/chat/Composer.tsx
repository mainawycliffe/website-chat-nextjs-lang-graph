import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ComposerProps = {
  containerRef?: React.Ref<HTMLElement>;
  input: string;
  setInput: (value: string) => void;
  isStreaming: boolean;
  onSubmit: (e?: React.FormEvent) => void;
  onRequestSend: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
};

export function Composer({
  containerRef,
  input,
  setInput,
  isStreaming,
  onSubmit,
  onRequestSend,
  textareaRef,
}: ComposerProps) {
  return (
    <footer ref={containerRef} className='sticky bottom-0'>
      <div className='vibrant-glass backdrop-blur'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          <form onSubmit={onSubmit} className='flex items-end gap-2'>
            <div className='vibrant-border flex-1 rounded-3xl p-px'>
              <div className='rounded-3xl bg-background/90 px-4 py-2 shadow-sm'>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onRequestSend();
                    }
                  }}
                  placeholder='Message…'
                  rows={1}
                  disabled={isStreaming}
                  className='min-h-0 border-0 px-0 py-0 focus-visible:ring-0'
                />
              </div>
            </div>

            <Button type='submit' disabled={isStreaming || !input.trim()} className='h-11 rounded-full px-5'>
              Send
            </Button>
          </form>
          <div className='mt-2 text-center text-xs text-foreground/50'>Enter to send • Shift+Enter new line</div>
        </div>
        <div className='vibrant-border h-px w-full' />
      </div>
    </footer>
  );
}
