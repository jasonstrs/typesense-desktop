import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections, useCreateCollection, useDeleteCollection } from '@/hooks/useCollections';
import { useNavigation } from '@/contexts/NavigationContext';
import { initializeClient } from '@/services/typesense';
import { Button } from '@/components/ui/button';
import { CreateCollectionDialog } from '@/components/Collections/CreateCollectionDialog';
import { CollectionDetailDialog } from '@/components/Collections/CollectionDetailDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Database, AlertCircle, Trash2, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CollectionsViewProps {
  onViewChange: (view: string) => void;
}

export function CollectionsView({ onViewChange }: CollectionsViewProps) {
  const { activeConnectionId, connections, getConnectionApiKey } = useConnectionStore();
  const { setSelectedCollectionForDocuments } = useNavigation();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isClientReady, setIsClientReady] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

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
    <div>
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
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections?.map((collection) => (
                <TableRow key={collection.name}>
                  <TableCell className="font-medium">{collection.name}</TableCell>
                  <TableCell>{collection.num_documents.toLocaleString()}</TableCell>
                  <TableCell>{collection.fields?.length || 0} fields</TableCell>
                  <TableCell>
                    {collection.created_at
                      ? new Date(collection.created_at * 1000).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocuments(collection.name)}
                        title="View Documents"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCollection(collection.name)}
                        title="View Schema"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteConfirm(collection.name)}
                        title="Delete Collection"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
