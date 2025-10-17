import { Search } from 'lucide-react';

export function SearchView() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Search view coming soon</h3>
        <p className="text-muted-foreground">This feature will be implemented in Phase 4</p>
      </div>
    </div>
  );
}
