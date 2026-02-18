export function EmptyAssistantHint() {
  return (
    <div className='border-b border-foreground/10'>
      <div className='px-4 py-6'>
        <div className='flex justify-start'>
          <div className='w-fit max-w-[82%] rounded-2xl rounded-bl-md bg-background px-4 py-3 text-sm leading-6 text-foreground shadow-sm'>
            Ask me anything about LangGraph (JavaScript). I’ll answer using the indexed docs and include a Sources list.
          </div>
        </div>
      </div>
    </div>
  );
}
