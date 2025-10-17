import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections, useCreateCollection, useDeleteCollection } from '@/hooks/useCollections';
import { initializeClient } from '@/services/typesense';
import { Button } from '@/components/ui/button';
import { CollectionCard } from '@/components/Collections/CollectionCard';
import { CreateCollectionDialog } from '@/components/Collections/CreateCollectionDialog';
import { CollectionDetailDialog } from '@/components/Collections/CollectionDetailDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { CollectionCreateRequest } from '@/types/typesense';

export function CollectionsView() {
  const { activeConnectionId, connections, getConnectionApiKey } = useConnectionStore();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  // Initialize Typesense client when active connection changes
  useEffect(() => {
    const initClient = async () => {
      if (activeConnection && activeConnectionId) {
        setIsClientReady(false);
        try {
          const apiKey = await getConnectionApiKey(activeConnectionId);
          initializeClient(activeConnection.url, apiKey);
          setIsClientReady(true);
        } catch (error) {
          console.error('Failed to initialize client:', error);
          toast.error('Failed to connect to Typesense');
          setIsClientReady(false);
        }
      } else {
        setIsClientReady(false);
      }
    };

    initClient();
  }, [activeConnection, activeConnectionId, getConnectionApiKey]);

  // Only fetch collections when client is ready
  const { data: collections, isLoading, error, refetch } = useCollections(isClientReady);

  const handleCreateCollection = async (data: CollectionCreateRequest) => {
    try {
      await createCollection.mutateAsync(data);
      toast.success(`Collection "${data.name}" created successfully!`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create collection');
      throw error;
    }
  };

  const handleDeleteCollection = async (collectionName: string) => {
    try {
      await deleteCollection.mutateAsync(collectionName);
      toast.success(`Collection "${collectionName}" deleted`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete collection');
    }
  };

  if (!activeConnection) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Collections</h1>
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Connection</h3>
          <p className="text-muted-foreground mb-4">Please connect to a Typesense instance first</p>
          <Button onClick={() => window.location.reload()}>Go to Connections</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground mt-1">
            Manage collections in {activeConnection.name}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Collection
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Collections</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : collections && collections.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Collections Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first collection to start storing documents
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections?.map((collection) => (
            <CollectionCard
              key={collection.name}
              collection={collection}
              onView={setSelectedCollection}
              onDelete={handleDeleteCollection}
            />
          ))}
        </div>
      )}

      <CreateCollectionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateCollection}
      />

      <CollectionDetailDialog
        collectionName={selectedCollection}
        open={!!selectedCollection}
        onOpenChange={(open) => !open && setSelectedCollection(null)}
      />
    </div>
  );
}
