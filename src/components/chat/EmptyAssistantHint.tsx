export function EmptyAssistantHint() {
  return (
    <div className='border-b border-foreground/10'>
      <div className='px-4 py-6'>
        <div className='flex flex-col justify-start'>
          <div className='w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-sm'>
            <p>
              Ask me anything about LangGraph (JavaScript/TypeScript). I’ll answer using the indexed docs and include a
              Sources list.
            </p>
            <div className='mt-2 text-xs'>Try asking about setup, usage, or examples.</div>
            <div className='mt-4 w-fit rounded bg-foreground/10 px-2 py-1 text-xs text-foreground'>
              Example questions:
            </div>
            <ul className='my-2 list-disc pl-5 text-xs'>
              <li>How do I create a LangGraph agent?</li>
              <li>What tools are available for LangGraph agents?</li>
              <li>How do I use the graph memory?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
