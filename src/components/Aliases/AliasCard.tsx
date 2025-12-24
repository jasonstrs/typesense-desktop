import { Button } from '@/components/ui/button';
import { Link2, ArrowRight, Trash2 } from 'lucide-react';
import type { CollectionAlias } from '@/hooks/useAliases';

interface AliasCardProps {
  alias: CollectionAlias;
  documentCount?: number;
  onDelete: (aliasName: string) => void;
  readOnly?: boolean;
}

export function AliasCard({ alias, documentCount, onDelete, readOnly = false }: AliasCardProps) {
  return (
    <div className="border rounded-lg bg-card h-full hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Icon Section */}
      <div className="w-full bg-muted flex items-center justify-center p-6">
        <Link2 className="w-16 h-16 text-muted-foreground" />
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Alias Name */}
        <h3 className="text-lg font-semibold mb-3 truncate" title={alias.name}>
          {alias.name}
        </h3>

        {/* Alias Mapping */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
            <span className="font-medium text-muted-foreground">Points to:</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{alias.collection_name}</span>
          </div>

          {documentCount !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Documents:</span>
              <span className="font-medium">{documentCount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex gap-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(alias.name)}
              className="flex-1"
              title="Delete Alias"
            >
              <Trash2 className="w-4 h-4 mr-1 text-destructive" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
