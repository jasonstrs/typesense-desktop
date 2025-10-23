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
import { FilterSidebar } from '@/components/Search/FilterSidebar';
import { ResultCard } from '@/components/Search/ResultCard';
import { Search, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';

export function SearchView() {
  const { activeConnectionId, connections, isClientReady } = useConnectionStore();
  const settings = useSettings();
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [queryByFields, setQueryByFields] = useState<string[]>([]);
  const [filterBy, setFilterBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [executeSearch, setExecuteSearch] = useState(false);
  const [filterMode, setFilterMode] = useState<'instant' | 'json'>('instant');
  const perPage = settings.defaultPageSize;

  // Debounce search query and filters
  const debouncedSearchQuery = useDebounce(searchQuery, settings.searchDebounceMs);
  const debouncedFilterBy = useDebounce(filterBy, settings.searchDebounceMs);

  const activeConnection = connections.find((c) => c.id === activeConnectionId);
  const { data: collections } = useCollections(isClientReady);
  const selectedCollectionData = collections?.find((c) => c.name === selectedCollection);

  // Reset query fields when collection changes and auto-execute search
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
      // Auto-execute search when collection is selected
      setExecuteSearch(true);
    }
  }, [selectedCollection, selectedCollectionData]);

  // Auto-trigger search when debounced query changes
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
    sortBy: sortBy && sortBy !== '' ? [sortBy] : undefined,
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
      toast.error('No searchable fields found');
      return;
    }
    setCurrentPage(1);
    setExecuteSearch(true);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterBy('');
    setSortBy('');
    setCurrentPage(1);
    setExecuteSearch(false);
  };

  const totalPages = searchResponse ? Math.ceil(searchResponse.found / perPage) : 0;
  const results = searchResponse?.hits || [];

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
      <div className="border-b bg-card p-4 space-y-3">
        {/* Row 1: Collection Selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedCollection} onValueChange={setSelectedCollection}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select collection..." />
            </SelectTrigger>
            <SelectContent>
              {collections?.map((collection) => (
                <SelectItem key={collection.name} value={collection.name}>
                  {collection.name} ({collection.num_documents})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 2: Search Input */}
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={!selectedCollection}>
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
            ) : results.length === 0 ? (
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
              <div className="flex flex-wrap gap-4">
                {results.map((hit, index) => (
                  <div
                    key={hit.document.id || index}
                    style={{
                      minWidth: '280px',
                      flex: '1 1 280px',
                      maxWidth: '320px',
                    }}
                  >
                    <ResultCard
                      document={hit.document}
                      score={hit.text_match}
                      searchQuery={searchQuery}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination - Sticky at Bottom */}
          {executeSearch && results.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-background border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * perPage + 1} to{' '}
                {Math.min(currentPage * perPage, searchResponse?.found || 0)} of{' '}
                {searchResponse?.found} results
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
        </div>
      </div>
    </div>
  );
}
