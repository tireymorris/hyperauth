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
      class={`glass-input ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    />
  );
};

export default Input;
