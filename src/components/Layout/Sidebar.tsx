import { Database, Search, Settings, Server, FileText, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'connections', label: 'Connections', icon: Server },
    { id: 'collections', label: 'Collections', icon: Database },
    { id: 'aliases', label: 'Aliases', icon: Link2 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Typesense Desktop</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    activeView === item.id &&
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
