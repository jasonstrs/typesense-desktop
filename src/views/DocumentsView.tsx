import { useState, useEffect } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections } from '@/hooks/useCollections';
import {
  useDocuments,
  useDeleteDocument,
  useCreateDocument,
  useUpdateDocument,
} from '@/hooks/useDocuments';
import { useSearch } from '@/hooks/useSearch';
import { useDebounce } from '@/hooks/useDebounce';
import { useSettings } from '@/hooks/useSettings';
import { useNavigation } from '@/contexts/NavigationContext';
import { initializeClient } from '@/services/typesense';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentDialog } from '@/components/Documents/DocumentDialog';
import { Plus, AlertCircle, ChevronLeft, ChevronRight, Pencil, Trash2, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function DocumentsView() {
  const { activeConnectionId, connections, getConnectionApiKey } = useConnectionStore();
  const settings = useSettings();
  const { selectedCollectionForDocuments, setSelectedCollectionForDocuments } = useNavigation();
  const [isClientReady, setIsClientReady] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Record<string, any> | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [queryByFields, setQueryByFields] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState('');
  const [sortBy, setSortBy] = useState<string[]>([]);

  const perPage = settings.defaultPageSize;

  // Debounce search inputs
  const debouncedSearchQuery = useDebounce(searchQuery, settings.searchDebounceMs);
  const debouncedFilterBy = useDebounce(filterBy, settings.searchDebounceMs);

  // Determine if we should use search or browse mode
  const isSearchActive = searchQuery.trim().length > 0;

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  // Auto-select collection from navigation context
  useEffect(() => {
    if (selectedCollectionForDocuments) {
      setSelectedCollection(selectedCollectionForDocuments);
      setSelectedCollectionForDocuments(null); // Clear after using
    }
  }, [selectedCollectionForDocuments, setSelectedCollectionForDocuments]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [settings.defaultPageSize]);

  // Reset to page 1 when debounced search values change
  useEffect(() => {
    if (isSearchActive && debouncedSearchQuery !== searchQuery) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, isSearchActive, searchQuery]);

  useEffect(() => {
    if (isSearchActive && debouncedFilterBy !== filterBy) {
      setCurrentPage(1);
    }
  }, [debouncedFilterBy, isSearchActive, filterBy]);

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

  const { data: collections } = useCollections(isClientReady);

  const selectedCollectionData = collections?.find((c) => c.name === selectedCollection);
  const collectionFields = selectedCollectionData?.fields?.map((field) => field.name) || [];

  // Initialize query fields when collection changes - use all string fields
  useEffect(() => {
    if (selectedCollection && selectedCollectionData) {
      // Get all searchable fields (string types including string* for auto)
      const searchableFields =
        selectedCollectionData.fields
          ?.filter(
            (field) =>
              field.type === 'string' ||
              field.type === 'string[]' ||
              field.type === 'string*' ||
              field.type === 'auto'
          )
          .map((field) => field.name) || [];

      setQueryByFields(searchableFields.length > 0 ? searchableFields : collectionFields);
      setFilterBy('');
      setSortBy([]);
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [selectedCollection, selectedCollectionData]);

  // Browse mode - fetch documents (when no search query)
  const {
    data: documentsResponse,
    isLoading: isLoadingDocuments,
    error: documentsError,
  } = useDocuments(
    selectedCollection,
    currentPage,
    perPage,
    isClientReady && !!selectedCollection && !isSearchActive
  );

  // Search mode - fetch search results (when search query is present)
  const {
    data: searchResponse,
    isLoading: isSearching,
    error: searchError,
  } = useSearch({
    collectionName: selectedCollection,
    searchQuery: debouncedSearchQuery,
    queryBy: queryByFields,
    filterBy: debouncedFilterBy || undefined,
    sortBy: sortBy.length > 0 ? sortBy : undefined,
    page: currentPage,
    perPage,
    enabled: isSearchActive && isClientReady && !!selectedCollection && queryByFields.length > 0,
  });

  const deleteDocument = useDeleteDocument(selectedCollection);
  const createDocument = useCreateDocument(selectedCollection);
  const updateDocument = useUpdateDocument(selectedCollection);

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument.mutateAsync(documentId);
      toast.success('Document deleted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete document');
    }
  };

  const handleAddDocument = async (document: Record<string, any>) => {
    try {
      await createDocument.mutateAsync(document);
      toast.success('Document added successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add document');
      throw error;
    }
  };

  const handleEditDocument = async (document: Record<string, any>) => {
    try {
      await updateDocument.mutateAsync({ id: document.id, document });
      toast.success('Document updated successfully');
      setEditingDocument(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update document');
      throw error;
    }
  };

  // Determine what data to display based on whether search is active
  const isLoading = isSearchActive ? isSearching : isLoadingDocuments;
  const error = isSearchActive ? searchError : documentsError;
  const results = isSearchActive ? searchResponse?.hits || [] : null;
  const documents = isSearchActive
    ? searchResponse?.hits?.map((hit) => hit.document) || []
    : documentsResponse?.hits?.map((hit) => hit.document) || [];
  const totalFound = isSearchActive ? searchResponse?.found || 0 : documentsResponse?.found || 0;
  const totalPages = totalFound > 0 ? Math.ceil(totalFound / perPage) : 0;

  if (!activeConnection) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Documents</h1>
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Active Connection</h3>
          <p className="text-muted-foreground mb-4">Please connect to a Typesense instance first</p>
          <Button onClick={() => window.location.reload()}>Go to Connections</Button>
        </div>
      </div>
    );
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between p-4 bg-background border-t">
        <div className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * perPage + 1} to{' '}
          {Math.min(currentPage * perPage, documentsResponse?.found || 0)} of{' '}
          {documentsResponse?.found} documents
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Select
              value={currentPage.toString()}
              onValueChange={(value) => setCurrentPage(Number(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <SelectItem key={page} value={page.toString()}>
                    {page}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">of {totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            Browse and search documents in {activeConnection.name}
          </p>
        </div>
        <Button disabled={!selectedCollection} onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Collection</label>
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Choose a collection..." />
          </SelectTrigger>
          <SelectContent>
            {collections?.map((collection) => (
              <SelectItem key={collection.name} value={collection.name}>
                {collection.name} ({collection.num_documents} documents)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search UI - always visible when collection is selected */}
      {selectedCollection && (
        <div className="space-y-4 mb-6">
          {/* Search query */}
          <div>
            <label className="block text-sm font-medium mb-2">Search Query (optional)</label>
            <Input
              type="text"
              placeholder="Leave empty to browse all documents, or enter search query..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Searches across all text fields: {queryByFields.join(', ')}
            </p>
          </div>

          {/* Advanced options */}
          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Options
            </summary>
            <div className="mt-4 space-y-4">
              {/* Filter by */}
              <div>
                <label className="block text-sm font-medium mb-2">Filter By (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., rating:>3 && category:=Books"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Use Typesense filter syntax</p>
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By (optional)</label>
                <Input
                  type="text"
                  placeholder="e.g., rating:desc,name:asc"
                  value={sortBy.join(',')}
                  onChange={(e) => setSortBy(e.target.value ? e.target.value.split(',') : [])}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Comma-separated field:order pairs
                </p>
              </div>
            </div>
          </details>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!selectedCollection ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Collection Selected</h3>
            <p className="text-muted-foreground">
              Please select a collection to view its documents
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : error ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to {isSearchActive ? 'Search' : 'Load Documents'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        ) : documents.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isSearchActive ? 'No Results Found' : 'No Documents'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isSearchActive
                ? 'Try adjusting your search query or filters'
                : "This collection doesn't have any documents yet"}
            </p>
            {!isSearchActive && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {isSearchActive && searchResponse && (
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  Found {searchResponse.found} documents in {searchResponse.search_time_ms}ms
                </p>
              </div>
            )}
            {isSearchActive && results
              ? results.map((hit, index) => (
                  <div
                    key={hit.document.id || index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            ID: {hit.document.id}
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Score: {hit.text_match}
                          </span>
                        </div>
                        {hit.highlights && hit.highlights.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Highlights:
                            </p>
                            {hit.highlights.map((highlight, idx) => (
                              <div key={idx} className="text-sm mb-1">
                                <span className="font-medium">{String(highlight.field)}:</span>{' '}
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlight.snippet || highlight.value || '',
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(hit.document, null, 2)}
                        </pre>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDocument(hit.document)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDocument(hit.document.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              : documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-muted-foreground mb-2">
                          ID: {doc.id}
                        </div>
                        <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => setEditingDocument(doc)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>

      {selectedCollection && documents.length > 0 && renderPagination()}

      <DocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDocument}
        mode="add"
        collectionName={selectedCollection}
      />

      <DocumentDialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        onSubmit={handleEditDocument}
        initialData={editingDocument || undefined}
        mode="edit"
        collectionName={selectedCollection}
      />
    </div>
  );
}
