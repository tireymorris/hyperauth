import type { FC } from 'hono/jsx';

type InputProps = {
  type?: 'text' | 'email' | 'password' | 'tel';
  name: string;
  placeholder?: string;
  value?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  maxlength?: number;
};

const Input: FC<InputProps> = ({
  type = 'text',
  name,
  placeholder,
  value,
  className = '',
  required = false,
  disabled = false,
  maxlength,
  id,
  ...props
}) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      required={required}
      disabled={disabled}
      maxlength={maxlength}
      id={id}
      className={`w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 hover:border-white/20 focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

export default Input;
