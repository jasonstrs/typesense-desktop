import { useState, useEffect } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCollections } from '@/hooks/useCollections';
import { useSearch } from '@/hooks/useSearch';
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
import { Search, AlertCircle, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

export function SearchView() {
  const { activeConnectionId, connections, isClientReady } = useConnectionStore();
  const settings = useSettings();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [queryByFields, setQueryByFields] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState('');
  const [sortBy, setSortBy] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [executeSearch, setExecuteSearch] = useState(false);
  const perPage = settings.defaultPageSize;

  // Debounce search query and filters with configurable delay
  const debouncedSearchQuery = useDebounce(searchQuery, settings.searchDebounceMs);
  const debouncedFilterBy = useDebounce(filterBy, settings.searchDebounceMs);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);

  const { data: collections } = useCollections(isClientReady);

  const selectedCollectionData = collections?.find((c) => c.name === selectedCollection);

  // Extract field names from schema
  const collectionFields = selectedCollectionData?.fields?.map((field) => field.name) || [];

  // Reset query fields when collection changes
  useEffect(() => {
    if (selectedCollection && collectionFields.length > 0) {
      // Get all searchable fields (string types)
      const searchableFields =
        selectedCollectionData?.fields
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
      setExecuteSearch(false);
      setCurrentPage(1);
    }
  }, [selectedCollection, collectionFields.length, selectedCollectionData]);

  // Auto-trigger search when debounced values change
  useEffect(() => {
    if (selectedCollection && queryByFields.length > 0 && debouncedSearchQuery) {
      setExecuteSearch(true);
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, selectedCollection, queryByFields.length]);

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
    enabled: executeSearch && isClientReady && !!selectedCollection && queryByFields.length > 0,
  });

  const handleSearch = () => {
    if (!selectedCollection) {
      toast.error('Please select a collection');
      return;
    }
    if (queryByFields.length === 0) {
      toast.error('Please select at least one field to search by');
      return;
    }
    setCurrentPage(1);
    setExecuteSearch(true);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterBy('');
    setSortBy([]);
    setCurrentPage(1);
    setExecuteSearch(false);
  };

  const totalPages = searchResponse ? Math.ceil(searchResponse.found / perPage) : 0;
  const results = searchResponse?.hits || [];

  if (!activeConnection) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Search</h1>
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
    if (!executeSearch || totalPages <= 1) return null;

    return (
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
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-1">Search documents in {activeConnection.name}</p>
      </div>

      {/* Collection selector */}
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

      {selectedCollection && (
        <div className="space-y-4 mb-6">
          {/* Search query */}
          <div>
            <label className="block text-sm font-medium mb-2">Search Query</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter search query (use * for all documents)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              {executeSearch && (
                <Button variant="outline" onClick={handleReset}>
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Searches across fields: {queryByFields.join(', ')}
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

      {/* Results area */}
      <div className="flex-1 overflow-y-auto">
        {!selectedCollection ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Collection Selected</h3>
            <p className="text-muted-foreground">Please select a collection to start searching</p>
          </div>
        ) : !executeSearch ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
            <p className="text-muted-foreground mb-4">
              Enter your search query and click the Search button
            </p>
          </div>
        ) : isSearching ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : searchError ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Search Failed</h3>
            <p className="text-muted-foreground mb-4">
              {searchError instanceof Error ? searchError.message : 'An error occurred'}
            </p>
            <Button onClick={handleSearch}>Try Again</Button>
          </div>
        ) : results.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search query or filters</p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Found {searchResponse?.found} documents in {searchResponse?.search_time_ms}ms
              </p>
            </div>
            {results.map((hit, index) => (
              <div
                key={hit.document.id || index}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
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
                        {hit.highlights.map((highlight, idx) => {
                          // Handle both snippet and matched_tokens
                          const highlightContent = highlight.snippet || highlight.value || '';
                          const matchedTokens = highlight.matched_tokens || [];
                          const fieldName = String(highlight.field);

                          // Get the actual field value from the document
                          const fieldValue = hit.document[fieldName];

                          return (
                            <div key={idx} className="text-sm mb-1">
                              <span className="font-medium">{fieldName}:</span>{' '}
                              {highlightContent ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: highlightContent,
                                  }}
                                />
                              ) : Array.isArray(fieldValue) ? (
                                // For array fields, show the full values and highlight matching ones
                                <span>
                                  {fieldValue.map((val, i) => {
                                    const strVal = String(val);
                                    const hasMatch = matchedTokens.some((token) =>
                                      strVal.toLowerCase().includes(String(token).toLowerCase())
                                    );
                                    return (
                                      <span key={i}>
                                        {i > 0 && ', '}
                                        {hasMatch ? (
                                          <mark className="bg-yellow-200 dark:bg-yellow-900">
                                            {strVal}
                                          </mark>
                                        ) : (
                                          <span>{strVal}</span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </span>
                              ) : matchedTokens.length > 0 ? (
                                // Fallback for non-array fields with matched tokens
                                <span>
                                  {matchedTokens.map((token, i) => (
                                    <span key={i}>
                                      {i > 0 && ', '}
                                      <mark className="bg-yellow-200 dark:bg-yellow-900">
                                        {token}
                                      </mark>
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                      {JSON.stringify(hit.document, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination - sticky at bottom */}
      {executeSearch && results.length > 0 && renderPagination()}
    </div>
  );
}
