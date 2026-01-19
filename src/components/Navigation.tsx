import type { FC } from 'hono/jsx';

type NavigationProps = {
  userEmail?: string;
  currentPath?: string;
  hasOrganization?: boolean;
};

const Navigation: FC<NavigationProps> = ({
  userEmail,
  currentPath: _currentPath,
  hasOrganization: _hasOrganization,
}) => {
  return (
    <nav class="bg-gray-800 p-4">
      <div class="container mx-auto flex justify-between items-center">
        <div class="text-white font-bold">HyperAuth</div>
        {userEmail && <div class="text-white">Welcome, {userEmail}</div>}
      </div>
    </nav>
  );
};

export default Navigation;
