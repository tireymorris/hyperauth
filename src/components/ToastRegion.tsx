import type { Child, FC } from 'hono/jsx';

type ToastRegionProps = {
  children: Child;
};

const ToastRegion: FC<ToastRegionProps> = ({ children }) => {
  return (
    <div
      id="toast-region"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-4 sm:px-6 sm:pt-6"
      aria-live="assertive"
      aria-relevant="additions text"
    >
      <div className="pointer-events-auto w-full max-w-md">{children}</div>
    </div>
  );
};

export default ToastRegion;
