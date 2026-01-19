import type { Child, FC } from 'hono/jsx';

interface IconButtonProps {
  onClick?: string;
  title?: string;
  className?: string;
  children: Child;
  'hx-get'?: string;
  'hx-target'?: string;
  'hx-swap'?: string;
  'hx-include'?: string;
}

const IconButton: FC<IconButtonProps> = (props) => {
  const { onClick, title, className = '', children, ...restProps } = props;

  const hxAttrs: Record<string, string> = {};
  Object.keys(restProps).forEach((key) => {
    if (key.startsWith('hx-')) {
      hxAttrs[key] = String(restProps[key as keyof typeof restProps]);
    }
  });

  return (
    <button
      class={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-black/40 text-white/70 ring-0 backdrop-blur-sm transition-all duration-200 hover:bg-black/60 hover:text-white focus:outline-none focus:ring-1 focus:ring-blue-400/30 ${className}`}
      {...(onClick ? { 'hx-on': `click: ${onClick}` } : {})}
      {...hxAttrs}
      type="button"
      title={title}
    >
      {children}
    </button>
  );
};

export const FullscreenButton: FC<{ className?: string }> = ({ className = '' }) => (
  <IconButton
    onClick="document.getElementById('hero-image').requestFullscreen()"
    title="View fullscreen"
    className={`absolute right-3 top-3 z-10 ${className}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 3h6m0 0v6m0-6L14 10M9 21H3m0 0v-6m0 6l7-7" />
    </svg>
  </IconButton>
);

export const CloseButton: FC<{ className?: string } & Partial<IconButtonProps>> = ({ className = '', ...props }) => (
  <IconButton title="Close" className={className} {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </IconButton>
);

export const DashboardCloseButton: FC<{ className?: string }> = ({ className = '' }) => (
  <CloseButton
    className={`absolute right-3 top-3 z-[10002] ${className}`}
    hx-get="/dashboard/close-modal"
    hx-target="#modal-container"
    hx-include="input[name='search'], input[name='start-date'], input[name='end-date'], input[name^='camera-']"
  />
);

export default IconButton;
