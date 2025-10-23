import { useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections, useCreateCollection, useDeleteCollection } from '@/hooks/useCollections';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';
import { CreateCollectionDialog } from '@/components/Collections/CreateCollectionDialog';
import { CollectionDetailDialog } from '@/components/Collections/CollectionDetailDialog';
import { CollectionCard } from '@/components/Collections/CollectionCard';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';

interface CollectionsViewProps {
  onViewChange: (view: string) => void;
}

export function CollectionsView({ onViewChange }: CollectionsViewProps) {
  const { activeConnectionId, connections, isClientReady } = useConnectionStore();
  const { setSelectedCollectionForDocuments } = useNavigation();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  // Only fetch collections when client is ready
  const { data: collections, isLoading, error, refetch } = useCollections(isClientReady);

  const handleCreateCollection = async (data: CollectionCreateSchema) => {
    try {
      await createCollection.mutateAsync(data);
      toast.success(`Collection "${data.name}" created successfully!`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create collection');
      throw error;
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionToDelete) return;

    try {
      await deleteCollection.mutateAsync(collectionToDelete);
      toast.success(`Collection "${collectionToDelete}" deleted`);
      setCollectionToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete collection');
    }
  };

  const openDeleteConfirm = (collectionName: string) => {
    setCollectionToDelete(collectionName);
    setDeleteConfirmOpen(true);
  };

  const handleViewDocuments = (collectionName: string) => {
    setSelectedCollectionForDocuments(collectionName);
    onViewChange('documents');
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
            <h1 className="text-2xl font-bold">Collections</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage collections in {activeConnection.name}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-wrap gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" style={{ minWidth: '280px', flex: '1 1 280px' }} />
            ))}
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Collections</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </div>
          </div>
        ) : collections && collections.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Database className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Collections Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first collection to start storing documents
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {collections?.map((collection) => (
              <div
                key={collection.name}
                style={{ minWidth: '280px', flex: '1 1 280px', maxWidth: '320px' }}
              >
                <CollectionCard
                  collection={collection}
                  onViewDocuments={handleViewDocuments}
                  onViewSchema={setSelectedCollection}
                  onDelete={openDeleteConfirm}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteCollection}
        title="Delete Collection"
        description={`Are you sure you want to delete collection "${collectionToDelete}"? This will delete all documents in the collection and cannot be undone.`}
        confirmText="Delete Collection"
        variant="destructive"
      />
    </div>
  );
}
