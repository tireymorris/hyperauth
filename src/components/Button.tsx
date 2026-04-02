import { type VariantProps, cva } from 'class-variance-authority';
import type { Child, FC } from 'hono/jsx';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md h-10 px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: Child;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onclick?: string;
}

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className,
  disabled = false,
  type = 'button',
  ...props
}) => {
  return (
    <button className={cn(buttonVariants({ variant, className }))} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  );
};

export default Button;
