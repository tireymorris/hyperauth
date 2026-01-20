import type { Child, FC } from 'hono/jsx';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ButtonProps {
  children: Child;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onclick?: string;
  'hx-boost'?: string;
  'hx-confirm'?: string;
  'hx-delete'?: string;
  'hx-get'?: string;
  'hx-include'?: string;
  'hx-indicator'?: string;
  'hx-post'?: string;
  'hx-put'?: string;
  'hx-swap'?: string;
  'hx-target'?: string;
  'hx-trigger'?: string;
  'hx-vals'?: string;
}

const Button: FC<ButtonProps> = (props) => {
  const {
    children,
    variant = 'primary',
    className = '',
    disabled = false,
    type = 'button',
    onclick,
    ...restProps
  } = props;

  // Use 'ghost' variant to avoid shadcn background conflicts with glass styling
  const shadcnVariant = 'ghost';
  const glassClass =
    variant === 'secondary' ? 'glass-button-secondary' : variant === 'danger' ? 'glass-button-danger' : 'glass-button';

  return (
    <ShadcnButton
      variant={shadcnVariant}
      className={cn(glassClass, className)}
      disabled={disabled}
      type={type}
      {...(onclick && { onclick })}
      {...restProps}
    >
      {children}
    </ShadcnButton>
  );
};

export default Button;
