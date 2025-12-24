import { useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useAliases, useCreateAlias, useDeleteAlias } from '@/hooks/useAliases';
import { useCollections } from '@/hooks/useCollections';
import { Button } from '@/components/ui/button';
import { CreateAliasDialog } from '@/components/Aliases/CreateAliasDialog';
import { AliasCard } from '@/components/Aliases/AliasCard';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Link2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AliasesView() {
  const { activeConnectionId, connections, isClientReady, isReadOnly } = useConnectionStore();
  const createAlias = useCreateAlias();
  const deleteAlias = useDeleteAlias();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [aliasToDelete, setAliasToDelete] = useState<string | null>(null);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  // Fetch aliases and collections
  const { data: aliases, isLoading, error, refetch } = useAliases(isClientReady, activeConnectionId);
  const { data: collections } = useCollections(isClientReady, activeConnectionId);

  const handleCreateAlias = async (data: { name: string; collection_name: string }) => {
    try {
      await createAlias.mutateAsync({
        aliasName: data.name,
        collectionName: data.collection_name,
      });
      toast.success(`Alias "${data.name}" created successfully!`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create alias');
      throw error;
    }
  };

  const handleDeleteAlias = async () => {
    if (!aliasToDelete) return;

    try {
      await deleteAlias.mutateAsync(aliasToDelete);
      toast.success(`Alias "${aliasToDelete}" deleted`);
      setAliasToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete alias');
    }
  };

  const openDeleteConfirm = (aliasName: string) => {
    setAliasToDelete(aliasName);
    setDeleteConfirmOpen(true);
  };

  // Get document count for an alias's target collection
  const getDocumentCount = (collectionName: string) => {
    const collection = collections?.find((c) => c.name === collectionName);
    return collection?.num_documents;
  };

  if (!activeConnection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Connection</h3>
          <p className="text-muted-foreground">Please connect to a Typesense instance first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Header Bar */}
      <div className="border-b bg-card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Collection Aliases</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage aliases in {activeConnection.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} disabled={isReadOnly}>
              <Plus className="w-4 h-4 mr-2" />
              Create Alias
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-wrap gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" style={{ minWidth: '280px', flex: '1 1 280px' }} />
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Aliases</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </div>
        ) : aliases && aliases.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Link2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Aliases Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first alias to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Alias
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {aliases?.map((alias) => (
              <div
                key={alias.name}
                style={{ minWidth: '280px', flex: '1 1 280px', maxWidth: '400px' }}
              >
                <AliasCard
                  alias={alias}
                  documentCount={getDocumentCount(alias.collection_name)}
                  onDelete={openDeleteConfirm}
                  readOnly={isReadOnly}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateAliasDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateAlias}
        collections={collections || []}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteAlias}
        title="Delete Alias"
        description={`Are you sure you want to delete the alias "${aliasToDelete}"? This will not delete the target collection.`}
        confirmText="Delete"
      />
    </div>
  );
}
