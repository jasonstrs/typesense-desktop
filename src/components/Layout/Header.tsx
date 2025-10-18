import { useConnectionStore } from '@/stores/connectionStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Header() {
  const { connections, activeConnectionId, setActiveConnection } = useConnectionStore();

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {activeConnection ? activeConnection.name : 'No Connection'}
          </h2>
          {activeConnection && (
            <span className="text-sm text-muted-foreground">{activeConnection.url}</span>
          )}
        </div>
        <Select
          value={activeConnectionId || ''}
          onValueChange={(value) => setActiveConnection(value || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select connection..." />
          </SelectTrigger>
          <SelectContent>
            {connections.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No connections</div>
            ) : (
              connections.map((connection) => (
                <SelectItem key={connection.id} value={connection.id}>
                  {connection.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}
