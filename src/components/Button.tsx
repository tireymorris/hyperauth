import type { Child, FC } from 'hono/jsx';

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

  const variantClass =
    variant === 'secondary' ? 'glass-button-secondary' : variant === 'danger' ? 'glass-button-danger' : '';

  const hxAttrs: Record<string, string> = {};
  Object.keys(restProps).forEach((key) => {
    if (key.startsWith('hx-')) {
      hxAttrs[key] = String(restProps[key as keyof typeof restProps]);
    }
  });

  return (
    <button
      class={`glass-button ${variantClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...hxAttrs}
      {...(onclick && { onclick })}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

export default Button;
