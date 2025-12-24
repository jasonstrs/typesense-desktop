import { useState, useEffect, useRef } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections } from '@/hooks/useCollections';
import { useAliases } from '@/hooks/useAliases';
import { useNavigation } from '@/contexts/NavigationContext';
import { useSearch } from '@/hooks/useSearch';
import { useDeleteDocument, useCreateDocument, useUpdateDocument } from '@/hooks/useDocuments';
import { useDebounce } from '@/hooks/useDebounce';
import { useSettings } from '@/hooks/useSettings';
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
import { FilterSidebar } from '@/components/Search/FilterSidebar';
import { DocumentCard } from '@/components/Documents/DocumentCard';
import { DocumentDialog } from '@/components/Documents/DocumentDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Plus,
  CheckSquare,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';

export function SearchView() {
  const { activeConnectionId, connections, isClientReady, isReadOnly } = useConnectionStore();
  const settings = useSettings();
  const {
    selectedCollection,
    setSelectedCollection,
    selectedCollectionForDocuments,
    setSelectedCollectionForDocuments,
  } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchById, setSearchById] = useState('');
  const [queryByFields, setQueryByFields] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [executeSearch, setExecuteSearch] = useState(false);
  const [filterMode, setFilterMode] = useState<'instant' | 'json'>('instant');
  const perPage = settings.defaultPageSize;

  // Document operations state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Record<string, any> | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  // Debounce search query and filters
  const debouncedSearchQuery = useDebounce(searchQuery, settings.searchDebounceMs);
  const debouncedFilterBy = useDebounce(filterBy, settings.searchDebounceMs);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);
  const { data: collections } = useCollections(isClientReady, activeConnectionId);
  const { data: aliases } = useAliases(isClientReady, activeConnectionId);

  // Resolve alias to actual collection name
  const resolvedCollectionName = (() => {
    if (!selectedCollection) return null;
    const alias = aliases?.find((a) => a.name === selectedCollection);
    return alias ? alias.collection_name : selectedCollection;
  })();

  const selectedCollectionData = collections?.find((c) => c.name === resolvedCollectionName);

  const deleteDocument = useDeleteDocument(selectedCollection || '');
  const createDocument = useCreateDocument(selectedCollection || '');
  const updateDocument = useUpdateDocument(selectedCollection || '');

  // Track previous connection ID to detect actual changes
  const prevConnectionIdRef = useRef(activeConnectionId);

  // Auto-select collection from navigation context (from Collections view)
  useEffect(() => {
    if (selectedCollectionForDocuments) {
      setSelectedCollection(selectedCollectionForDocuments);
      // Clear after setting to prevent re-triggering
      setSelectedCollectionForDocuments(null);
    }
  }, [selectedCollectionForDocuments, setSelectedCollection, setSelectedCollectionForDocuments]);

  // Reset state when connection actually changes (not on mount)
  useEffect(() => {
    if (prevConnectionIdRef.current !== activeConnectionId) {
      setSelectedCollection(null);
      setSearchQuery('');
      setSearchById('');
      setQueryByFields([]);
      setFilterBy('');
      setSortBy('');
      setCurrentPage(1);
      setExecuteSearch(false);
      setSelectedDocIds(new Set());
      prevConnectionIdRef.current = activeConnectionId;
    }
  }, [activeConnectionId]);

  // Reset query fields when collection changes and auto-execute search to show all documents
  useEffect(() => {
    if (selectedCollection && selectedCollectionData) {
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

      setQueryByFields(
        searchableFields.length > 0
          ? searchableFields
          : selectedCollectionData.fields?.map((f) => f.name) || []
      );
      setFilterBy('');
      setSortBy('');
      setCurrentPage(1);
      setSearchQuery('');
      setSearchById('');
      setSelectedDocIds(new Set());
      // Auto-execute search to show all documents
      setExecuteSearch(true);
    }
  }, [selectedCollection, selectedCollectionData]);

  // Auto-trigger search when debounced query changes (only if there's a query and not searching by ID)
  useEffect(() => {
    if (selectedCollection && queryByFields.length > 0 && debouncedSearchQuery && !searchById) {
      setExecuteSearch(true);
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, selectedCollection, queryByFields.length, searchById]);

  useEffect(() => {
    if (executeSearch && debouncedFilterBy !== filterBy) {
      setCurrentPage(1);
    }
  }, [debouncedFilterBy, executeSearch, filterBy]);

  // Reset to page 1 when page size changes
  useEffect(() => {
    if (currentPage > 1) {
      setCurrentPage(1);
    }
  }, [settings.defaultPageSize]);

  // Build filter for search by ID
  const effectiveFilterBy = searchById ? `id:=${searchById}` : debouncedFilterBy || undefined;

  // Use debounced values for auto-search, or '*' when searching by ID
  const activeSearchQuery = searchById ? '*' : debouncedSearchQuery || '*';

  const {
    data: searchResponse,
    isLoading: isSearching,
    error: searchError,
    refetch: refetchSearch,
  } = useSearch({
    collectionName: selectedCollection || '',
    searchQuery: activeSearchQuery,
    queryBy: queryByFields,
    filterBy: effectiveFilterBy,
    sortBy: sortBy && sortBy !== '' ? [sortBy] : undefined,
    page: currentPage,
    perPage,
    enabled: executeSearch && isClientReady && !!selectedCollection && queryByFields.length > 0,
    connectionId: activeConnectionId,
  });

  const handleSearch = () => {
    if (!selectedCollection) {
      toast.error('Please select a collection');
      return;
    }
    if (queryByFields.length === 0) {
      toast.error('No searchable fields found');
      return;
    }
    setCurrentPage(1);
    setExecuteSearch(true);
  };

  const handleSearchById = () => {
    if (!searchById.trim()) {
      toast.error('Please enter a document ID');
      return;
    }
    setSearchQuery('');
    setCurrentPage(1);
    setExecuteSearch(true);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchById('');
    setFilterBy('');
    setSortBy('');
    setCurrentPage(1);
    setExecuteSearch(true); // Keep showing all documents
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument.mutateAsync(documentToDelete);
      toast.success('Document deleted successfully');
      setDocumentToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete document');
    }
  };

  const openDeleteConfirm = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteConfirmOpen(true);
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

  const handleToggleDocSelection = (docId: string) => {
    setSelectedDocIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    const documents = searchResponse?.hits?.map((hit) => hit.document) || [];
    if (selectedDocIds.size === documents.length && documents.length > 0) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documents.map((doc) => doc.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.size === 0) return;

    setIsBulkDeleting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const docId of Array.from(selectedDocIds)) {
        try {
          await deleteDocument.mutateAsync(docId);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to delete document ${docId}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} document(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} document(s)`);
      }

      setSelectedDocIds(new Set());
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const totalPages = searchResponse ? Math.ceil(searchResponse.found / perPage) : 0;
  const documents = searchResponse?.hits?.map((hit) => hit.document) || [];

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
      {/* Top Search Bar */}
      <div className="border-b bg-card p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter search query..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setSearchById('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
            disabled={!!searchById}
          />
          <Input
            type="text"
            placeholder="Search by ID..."
            value={searchById}
            onChange={(e) => {
              setSearchById(e.target.value);
              if (e.target.value) setSearchQuery('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchById()}
            className="w-64"
            disabled={!!searchQuery}
          />
          <Button
            onClick={searchById ? handleSearchById : handleSearch}
            disabled={!selectedCollection}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          {executeSearch && (
            <>
              <Button variant="outline" onClick={() => refetchSearch()} disabled={isSearching}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          )}
          <Button
            disabled={!selectedCollection || isReadOnly}
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Search Info */}
        {executeSearch && searchResponse && (
          <div className="text-sm text-muted-foreground">
            Found {searchResponse.found} results in {searchResponse.search_time_ms}ms
          </div>
        )}
      </div>

      {/* Main Content Area: Sidebar + Results */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Filters */}
        {selectedCollection && selectedCollectionData && (
          <FilterSidebar
            fields={selectedCollectionData.fields || []}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            filterBy={filterBy}
            onFilterByChange={setFilterBy}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            queryByFields={queryByFields}
            onQueryByFieldsChange={setQueryByFields}
            mode={filterMode}
            onModeChange={setFilterMode}
          />
        )}

        {/* Right Content Area - Results Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bulk actions toolbar */}
          {selectedDocIds.size > 0 && !isReadOnly && (
            <div className="mx-6 mt-4 border rounded-lg p-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {selectedDocIds.size} document{selectedDocIds.size > 1 ? 's' : ''} selected
                  </p>
                  <Button variant="outline" size="sm" onClick={handleToggleSelectAll}>
                    Deselect All
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteConfirmOpen(true)}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : `Delete ${selectedDocIds.size}`}
                </Button>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedCollection ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Select a Collection</h3>
                  <p className="text-muted-foreground">
                    Choose a collection from the dropdown above to start searching
                  </p>
                </div>
              </div>
            ) : !executeSearch ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
                  <p className="text-muted-foreground">
                    Enter a search query and press Search or Enter
                  </p>
                </div>
              </div>
            ) : isSearching ? (
              <div className="flex flex-wrap gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-64"
                    style={{ minWidth: '280px', flex: '1 1 280px' }}
                  />
                ))}
              </div>
            ) : searchError ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">Search Failed</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchError instanceof Error ? searchError.message : 'An error occurred'}
                  </p>
                  <Button onClick={handleSearch}>Try Again</Button>
                </div>
              </div>
            ) : documents.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search query or filters
                  </p>
                </div>
              </div>
            ) : (
              <>
                {documents.length > 0 && !isReadOnly && (
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {documents.length} of {searchResponse?.found} documents
                    </p>
                    <Button variant="outline" size="sm" onClick={handleToggleSelectAll}>
                      {selectedDocIds.size === documents.length && documents.length > 0 ? (
                        <>
                          <CheckSquare className="w-4 h-4 mr-2" />
                          Deselect All
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Select All
                        </>
                      )}
                    </Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        minWidth: '280px',
                        flex: '1 1 280px',
                        maxWidth: '320px',
                      }}
                    >
                      <DocumentCard
                        document={doc}
                        isSelected={selectedDocIds.has(doc.id)}
                        onToggleSelect={() => handleToggleDocSelection(doc.id)}
                        onEdit={() => setEditingDocument(doc)}
                        onDelete={() => openDeleteConfirm(doc.id)}
                        readOnly={isReadOnly}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Pagination - Sticky at Bottom */}
      {executeSearch && documents.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-background border-t sticky bottom-0">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * perPage + 1} to{' '}
            {Math.min(currentPage * perPage, searchResponse?.found || 0)} of {searchResponse?.found}{' '}
            results
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
      )}

      <DocumentDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddDocument}
        mode="add"
        collectionName={selectedCollection || ''}
      />

      <DocumentDialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        onSubmit={handleEditDocument}
        initialData={editingDocument || undefined}
        mode="edit"
        collectionName={selectedCollection || ''}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteDocument}
        title="Delete Document"
        description={`Are you sure you want to delete document "${documentToDelete}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        onOpenChange={setBulkDeleteConfirmOpen}
        onConfirm={handleBulkDelete}
        title="Delete Multiple Documents"
        description={`Are you sure you want to delete ${selectedDocIds.size} document(s)? This action cannot be undone.`}
        confirmText={`Delete ${selectedDocIds.size}`}
        variant="destructive"
      />
    </div>
  );
}
