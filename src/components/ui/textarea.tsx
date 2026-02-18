import { clsx } from 'clsx';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={twMerge(
        clsx(
          'flex min-h-24 w-full resize-none rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-foreground/50 focus-visible:ring-2 focus-visible:ring-foreground/20',
          className,
        ),
      )}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
