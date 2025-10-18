import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/ConnectionManager/ConnectionForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionsView() {
  const {
    connections,
    activeConnectionId,
    loadConnections,
    addConnection,
    deleteConnection,
    setActiveConnection,
  } = useConnectionStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleAddConnection = async (data: { name: string; url: string; apiKey: string }) => {
    try {
      const newConnection = {
        id: crypto.randomUUID(),
        name: data.name,
        url: data.url,
      };
      await addConnection(newConnection, data.apiKey);
      toast.success('Connection added successfully!');
    } catch (error) {
      toast.error('Failed to add connection');
      throw error;
    }
  };

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return;

    try {
      await deleteConnection(connectionToDelete.id);
      toast.success('Connection deleted');
      setConnectionToDelete(null);
    } catch (error) {
      toast.error('Failed to delete connection');
    }
  };

  const openDeleteConfirm = (connectionId: string, connectionName: string) => {
    setConnectionToDelete({ id: connectionId, name: connectionName });
    setDeleteConfirmOpen(true);
  };

  const handleSetActive = async (connectionId: string) => {
    try {
      await setActiveConnection(connectionId);
      toast.success('Active connection changed');
    } catch (error) {
      toast.error('Failed to set active connection');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Connections</h1>
          <p className="text-muted-foreground mt-1">Manage your Typesense server connections</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {connections.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first Typesense server connection to get started
          </p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {activeConnectionId === connection.id && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <h3 className="font-semibold">{connection.name}</h3>
                  <p className="text-sm text-muted-foreground">{connection.url}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {activeConnectionId !== connection.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetActive(connection.id)}
                  >
                    Set Active
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteConfirm(connection.id, connection.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConnectionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddConnection}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConnection}
        title="Delete Connection"
        description={`Are you sure you want to delete connection "${connectionToDelete?.name}"? This will remove the saved API key and connection details.`}
        confirmText="Delete Connection"
        variant="destructive"
      />
    </div>
  );
}

function Server(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}
