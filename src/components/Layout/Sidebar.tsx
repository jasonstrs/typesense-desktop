import { Database, Settings, Server, Link2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections } from '@/hooks/useCollections';
import { useAliases } from '@/hooks/useAliases';
import { useNavigation } from '@/contexts/NavigationContext';
import { getDisplayName } from '@/lib/aliasResolver';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { activeConnectionId, isClientReady } = useConnectionStore();
  const { data: collections } = useCollections(isClientReady, activeConnectionId);
  const { data: aliases } = useAliases(isClientReady, activeConnectionId);
  const { selectedCollection, setSelectedCollection } = useNavigation();

  const menuItems = [
    { id: 'connections', label: 'Connections', icon: Server },
    { id: 'collections', label: 'Collections', icon: Database },
    { id: 'aliases', label: 'Aliases', icon: Link2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleCollectionSelect = (collectionName: string) => {
    setSelectedCollection(collectionName);
    // Don't change view if already on search page to avoid reset
    if (activeView !== 'search') {
      onViewChange('search');
    }
  };

  return (
    <div className="w-64 border-r bg-card h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold">Typesense Desktop</h1>
      </div>
      <nav className="flex-1 p-4 flex flex-col">
        <ul className="space-y-2 mb-4">
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

        {/* Divider */}
        {activeConnectionId && (
          <>
            <div className="border-t my-4" />

            {/* Collection Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium px-4 block mb-2">Collection</label>
              <Select value={selectedCollection || ''} onValueChange={handleCollectionSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select collection..." />
                </SelectTrigger>
                <SelectContent>
                  {/* Show aliases first */}
                  {aliases?.map((alias) => {
                    const targetCollection = collections?.find(
                      (c) => c.name === alias.collection_name
                    );
                    return (
                      <SelectItem key={`alias-${alias.name}`} value={alias.name}>
                        🔗 {alias.name} ({targetCollection?.num_documents || 0})
                      </SelectItem>
                    );
                  })}
                  {/* Then show collections */}
                  {collections?.map((collection) => {
                    const displayName = getDisplayName(collection.name, aliases);
                    // Only show collection if it doesn't have an alias
                    if (displayName === collection.name) {
                      return (
                        <SelectItem key={`collection-${collection.name}`} value={collection.name}>
                          📁 {collection.name} ({collection.num_documents})
                        </SelectItem>
                      );
                    }
                    return null;
                  })}
                </SelectContent>
              </Select>

              {/* Search menu item - appears when collection is selected */}
              {selectedCollection && (
                <button
                  onClick={() => onViewChange('search')}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mt-2',
                    'hover:bg-accent hover:text-accent-foreground',
                    activeView === 'search' &&
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              )}
            </div>
          </>
        )}
      </nav>
    </div>
  );
}
