import type { FC } from 'hono/jsx';

import { cn } from '@/lib/utils';

type InputProps = JSX.HTMLAttributes<HTMLInputElement>;

const Input: FC<InputProps> = ({ className, disabled, ...props }) => {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 glass-input',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    />
  );
};

export { Input };
