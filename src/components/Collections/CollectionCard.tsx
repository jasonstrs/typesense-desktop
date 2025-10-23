import { Button } from '@/components/ui/button';
import { Database, FileText, Eye, Trash2 } from 'lucide-react';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';

interface CollectionCardProps {
  collection: CollectionSchema;
  onViewDocuments: (collectionName: string) => void;
  onViewSchema: (collectionName: string) => void;
  onDelete: (collectionName: string) => void;
}

export function CollectionCard({
  collection,
  onViewDocuments,
  onViewSchema,
  onDelete,
}: CollectionCardProps) {
  return (
    <div className="border rounded-lg bg-card hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Icon Section */}
      <div className="w-full bg-muted flex items-center justify-center p-6">
        <Database className="w-16 h-16 text-muted-foreground" />
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Collection Name */}
        <h3 className="text-lg font-semibold mb-3 truncate" title={collection.name}>
          {collection.name}
        </h3>

        {/* Collection Stats */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Documents:</span>
            <span className="font-medium">
              {collection.num_documents.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fields:</span>
            <span className="font-medium">{collection.fields?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">
              {collection.created_at
                ? new Date(collection.created_at * 1000).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDocuments(collection.name)}
            className="flex-1"
            title="View Documents"
          >
            <FileText className="w-4 h-4 mr-1" />
            Documents
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewSchema(collection.name)}
            title="View Schema"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(collection.name)}
            title="Delete Collection"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}
