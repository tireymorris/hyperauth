import type { FC } from 'hono/jsx';

type ToastProps = {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

const Toast: FC<ToastProps> = ({ type, message }) => {
  const config = {
    info: {
      bg: 'rgba(6, 182, 212, 0.1)',
      border: 'rgba(6, 182, 212, 0.3)',
      text: '#22d3ee',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#34d399',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#fbbf24',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    error: {
      bg: 'rgba(244, 63, 94, 0.1)',
      border: 'rgba(244, 63, 94, 0.3)',
      text: '#fb7185',
      icon: (
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  }[type];

  return (
    <div
      class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl"
      style={`background: ${config.bg}; border: 1px solid ${config.border}; color: ${config.text};`}
    >
      {config.icon}
      <span class="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;
