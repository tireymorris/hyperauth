import type { FC } from 'hono/jsx';

type NavigationProps = {
  userEmail?: string;
  currentPath?: string;
};

const Navigation: FC<NavigationProps> = ({ userEmail }) => {
  return (
    <nav class="fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 z-50">
      <div class="container mx-auto flex justify-between items-center">
        <div class="text-white font-bold">HyperAuth</div>
        {userEmail && <div class="text-slate-300">{userEmail}</div>}
      </div>
    </nav>
  );
};

export default Navigation;
