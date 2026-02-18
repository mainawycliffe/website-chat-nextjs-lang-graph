import { Button } from '@/components/ui/button';

type ChatHeaderProps = {
  isStreaming: boolean;
  onStop: () => void;
};

export function ChatHeader({ isStreaming, onStop }: ChatHeaderProps) {
  return (
    <header className='sticky top-0 z-10'>
      <div className='vibrant-glass backdrop-blur'>
        <div className='flex items-center max-w-4xl mx-auto justify-between px-4 py-3'>
          <div className='flex min-w-0 flex-col'>
            <div className='flex items-center gap-2 truncate text-sm font-semibold tracking-tight'>
              <span
                className='h-2.5 w-2.5 rounded-full'
                style={{
                  background:
                    'radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--accent) 85%, white), var(--accent))',
                  boxShadow:
                    '0 0 0 1px color-mix(in oklab, var(--accent) 30%, transparent), 0 10px 30px color-mix(in oklab, var(--accent) 18%, transparent)',
                }}
              />
              <span className='truncate'>LangGraph Docs Assistant</span>
            </div>
            <div className='truncate text-xs text-foreground/60'>Docs-grounded chat</div>
          </div>
          <Button type='button' variant='outline' onClick={onStop} disabled={!isStreaming} className='h-9'>
            Stop
          </Button>
        </div>
        <div className='vibrant-border h-px w-full' />
      </div>
    </header>
  );
}
