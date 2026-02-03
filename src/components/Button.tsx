import type { Child, FC } from 'hono/jsx';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: Child;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}) => {
  const variantClasses = {
    primary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <ShadcnButton variant="ghost" className={cn(variantClasses[variant], className)} disabled={disabled} type={type}>
      {children}
    </ShadcnButton>
  );
};

export default Button;
