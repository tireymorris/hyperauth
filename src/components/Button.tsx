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

  const baseClasses =
    'rounded-lg font-medium transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 px-4 py-2';

  const variantClasses = {
    primary:
      'border border-blue-500/50 bg-blue-500/30 text-white backdrop-blur-md shadow-lg hover:bg-blue-500/40 hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none',
    secondary:
      'border border-white/20 bg-black/40 text-white backdrop-blur-md shadow-lg hover:bg-black/50 hover:border-white/30 focus:ring-2 focus:ring-white/20 focus:outline-none',
    danger:
      'border border-red-500/50 bg-red-500/30 text-white backdrop-blur-md shadow-lg hover:bg-red-500/40 hover:border-red-400 focus:ring-2 focus:ring-red-500/20 focus:outline-none',
  };

  const hxAttrs: Record<string, string> = {};
  Object.keys(restProps).forEach((key) => {
    if (key.startsWith('hx-')) {
      hxAttrs[key] = String(restProps[key as keyof typeof restProps]);
    }
  });

  return (
    <button
      class={`${baseClasses} ${variantClasses[variant]} ${className}`}
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
