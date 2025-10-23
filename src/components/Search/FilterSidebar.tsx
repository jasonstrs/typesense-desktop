import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CollectionFieldSchema } from 'typesense/lib/Typesense/Collection';

interface FilterSidebarProps {
  fields: CollectionFieldSchema[];
  sortBy: string;
  onSortByChange: (value: string) => void;
  filterBy: string;
  onFilterByChange: (value: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  queryByFields: string[];
  onQueryByFieldsChange: (value: string[]) => void;
  mode: 'instant' | 'json';
  onModeChange: (mode: 'instant' | 'json') => void;
}

export function FilterSidebar({
  fields,
  sortBy,
  onSortByChange,
  filterBy,
  onFilterByChange,
  searchQuery,
  onSearchQueryChange,
  queryByFields,
  onQueryByFieldsChange,
  mode,
  onModeChange,
}: FilterSidebarProps) {
  const [numericRanges, setNumericRanges] = useState<Record<string, { min: string; max: string }>>({});
  const [stringFilters, setStringFilters] = useState<Record<string, string>>({});

  // JSON mode state
  const [jsonQuery, setJsonQuery] = useState(searchQuery);
  const [jsonQueryBy, setJsonQueryBy] = useState(queryByFields.join(', '));
  const [jsonFilterBy, setJsonFilterBy] = useState(filterBy);
  const [jsonSortBy, setJsonSortBy] = useState(sortBy);

  // Separate and sort fields by type and name
  const numericFields = fields
    .filter((f) => ['int32', 'int64', 'float'].includes(f.type))
    .sort((a, b) => a.name.localeCompare(b.name));

  const stringFields = fields
    .filter((f) => ['string', 'string[]', 'string*'].includes(f.type))
    .sort((a, b) => a.name.localeCompare(b.name));

  const sortableFields = fields
    .filter((f) => !f.type.includes('[]'))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Sync JSON mode when switching from Instant to JSON
  useEffect(() => {
    if (mode === 'json') {
      setJsonQuery(searchQuery);
      setJsonQueryBy(queryByFields.join(', '));
      setJsonFilterBy(filterBy);
      setJsonSortBy(sortBy);
    }
  }, [mode]);

  // Apply JSON changes when in JSON mode
  const applyJsonChanges = () => {
    onSearchQueryChange(jsonQuery);
    onQueryByFieldsChange(jsonQueryBy.split(',').map((f) => f.trim()).filter((f) => f));
    onFilterByChange(jsonFilterBy);
    onSortByChange(jsonSortBy);
  };

  // Build filter query from individual field filters (only in instant mode)
  useEffect(() => {
    if (mode !== 'instant') return;
    const filters: string[] = [];

    // Add numeric range filters
    Object.entries(numericRanges).forEach(([field, range]) => {
      if (range.min && range.max) {
        filters.push(`${field}:[${range.min}..${range.max}]`);
      } else if (range.min) {
        filters.push(`${field}:>=${range.min}`);
      } else if (range.max) {
        filters.push(`${field}:<=${range.max}`);
      }
    });

    // Add string partial match filters with wildcard
    Object.entries(stringFilters).forEach(([field, value]) => {
      if (value.trim()) {
        // Append * for prefix matching (e.g., "Mar" matches "Marc Jobs")
        filters.push(`${field}:${value}*`);
      }
    });

    const newFilterQuery = filters.join(' && ');
    if (newFilterQuery !== filterBy) {
      onFilterByChange(newFilterQuery);
    }
  }, [numericRanges, stringFilters, fields]);

  const handleNumericRangeChange = (fieldName: string, type: 'min' | 'max', value: string) => {
    setNumericRanges((prev) => ({
      ...prev,
      [fieldName]: {
        min: type === 'min' ? value : prev[fieldName]?.min || '',
        max: type === 'max' ? value : prev[fieldName]?.max || '',
      },
    }));
  };

  const handleStringFilterChange = (fieldName: string, value: string) => {
    setStringFilters((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <div className="w-64 border-r bg-card p-4 space-y-6 overflow-y-auto">
      <div>
        <h3 className="font-semibold text-lg mb-2">Filters</h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={mode === 'instant' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('instant')}
            className="flex-1 text-xs"
          >
            Instant
          </Button>
          <Button
            variant={mode === 'json' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onModeChange('json')}
            className="flex-1 text-xs"
          >
            JSON
          </Button>
        </div>
      </div>

      {mode === 'instant' ? (
        // Instant Search Mode
        <>

      {/* Sort By */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select value={sortBy || 'default'} onValueChange={(value) => onSortByChange(value === 'default' ? '' : value)}>
          <SelectTrigger>
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            {sortableFields.map((field) => (
              <>
                <SelectItem key={`${field.name}:asc`} value={`${field.name}:asc`}>
                  {field.name} ↑
                </SelectItem>
                <SelectItem key={`${field.name}:desc`} value={`${field.name}:desc`}>
                  {field.name} ↓
                </SelectItem>
              </>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Numeric Fields Filters */}
      {numericFields.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Numeric Fields</Label>
          {numericFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label className="text-xs text-muted-foreground">{field.name}</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={numericRanges[field.name]?.min || ''}
                  onChange={(e) => handleNumericRangeChange(field.name, 'min', e.target.value)}
                  className="text-sm h-8"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={numericRanges[field.name]?.max || ''}
                  onChange={(e) => handleNumericRangeChange(field.name, 'max', e.target.value)}
                  className="text-sm h-8"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* String Fields Filters */}
      {stringFields.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">String Fields</Label>
          {stringFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{field.name}</Label>
              <Input
                type="text"
                placeholder="partial match"
                value={stringFilters[field.name] || ''}
                onChange={(e) => handleStringFilterChange(field.name, e.target.value)}
                className="text-sm h-8"
              />
            </div>
          ))}
        </div>
      )}
      </>
      ) : (
        // JSON Mode
        <>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium mb-2">Query (q)</Label>
              <Input
                type="text"
                placeholder="e.g., jacket"
                value={jsonQuery}
                onChange={(e) => setJsonQuery(e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Query By (query_by)</Label>
              <Input
                type="text"
                placeholder="e.g., title, description"
                value={jsonQueryBy}
                onChange={(e) => setJsonQueryBy(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated field names
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Filter By (filter_by)</Label>
              <Textarea
                placeholder="e.g., price:>100 && brand:Nike"
                value={jsonFilterBy}
                onChange={(e) => setJsonFilterBy(e.target.value)}
                className="text-sm font-mono"
                rows={4}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">Sort By (sort_by)</Label>
              <Input
                type="text"
                placeholder="e.g., price:desc"
                value={jsonSortBy}
                onChange={(e) => setJsonSortBy(e.target.value)}
                className="text-sm"
              />
            </div>

            <Button onClick={applyJsonChanges} className="w-full" size="sm">
              Apply Changes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
