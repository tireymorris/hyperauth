import type { FC } from 'hono/jsx';

type ToastProps = {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

const Toast: FC<ToastProps> = ({ type, message }) => {
  const colorClass = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  }[type];

  return <div class={`fixed top-4 right-4 ${colorClass} text-white p-4 rounded shadow-lg z-50`}>{message}</div>;
};

export default Toast;
