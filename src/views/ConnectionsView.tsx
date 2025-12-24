import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { Button } from '@/components/ui/button';
import { ConnectionForm } from '@/components/ConnectionManager/ConnectionForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Trash2, CheckCircle, Loader2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Connection } from '@/types/connection';

export function ConnectionsView() {
  const {
    connections,
    activeConnectionId,
    loadConnections,
    addConnection,
    updateConnection,
    deleteConnection,
    setActiveConnection,
    testConnection,
    getConnectionApiKey,
  } = useConnectionStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleAddConnection = async (data: { name: string; url: string; apiKey: string; readOnly?: boolean }) => {
    try {
      const newConnection = {
        id: crypto.randomUUID(),
        name: data.name,
        url: data.url,
        readOnly: data.readOnly,
      };
      await addConnection(newConnection, data.apiKey);
      toast.success('Connection added successfully!');
    } catch (error) {
      toast.error('Failed to add connection');
      throw error;
    }
  };

  const handleEditConnection = async (data: { name: string; url: string; apiKey: string; readOnly?: boolean }) => {
    if (!editingConnection) return;

    try {
      const updates = {
        name: data.name,
        url: data.url,
        readOnly: data.readOnly,
      };
      // Only update API key if it's been changed (not empty)
      await updateConnection(editingConnection.id, updates, data.apiKey || undefined);
      toast.success('Connection updated successfully!');
      setEditingConnection(null);
    } catch (error) {
      toast.error('Failed to update connection');
      throw error;
    }
  };

  const openEditDialog = async (connection: Connection) => {
    // Fetch the API key for editing
    try {
      const apiKey = await getConnectionApiKey(connection.id);
      setEditingConnection({ ...connection, apiKey } as any);
    } catch (error) {
      toast.error('Failed to load connection details');
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

  const handleTestConnection = async (connectionId: string, url: string) => {
    setTestingConnectionId(connectionId);
    try {
      const apiKey = await getConnectionApiKey(connectionId);
      const success = await testConnection(url, apiKey);
      if (success) {
        toast.success('Connection successful!');
      } else {
        toast.error('Connection failed. Please check your configuration.');
      }
    } catch (error) {
      toast.error('Failed to test connection');
    } finally {
      setTestingConnectionId(null);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Header Bar */}
      <div className="border-b bg-card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Connections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your Typesense server connections
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">

        {connections.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No connections yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first Typesense server connection to get started
              </p>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Connection
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="border rounded-lg p-3 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {activeConnectionId === connection.id && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">{connection.name}</h3>
                    <p className="text-xs text-muted-foreground">{connection.url}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestConnection(connection.id, connection.url)}
                    disabled={testingConnectionId === connection.id}
                  >
                    {testingConnectionId === connection.id && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(connection)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
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
      </div>

      <ConnectionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddConnection}
        mode="create"
      />

      <ConnectionForm
        open={!!editingConnection}
        onOpenChange={(open) => !open && setEditingConnection(null)}
        onSubmit={handleEditConnection}
        initialData={editingConnection as any}
        mode="edit"
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
