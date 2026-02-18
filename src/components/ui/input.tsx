import { clsx } from 'clsx';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={twMerge(
        clsx(
          'flex h-10 w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-foreground/50 focus-visible:ring-2 focus-visible:ring-foreground/20',
          className,
        ),
      )}
      {...props}
    />
  );
});
Input.displayName = 'Input';
