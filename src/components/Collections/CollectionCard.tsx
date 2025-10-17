import { Collection } from '@/types/typesense';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';

interface CollectionCardProps {
  collection: Collection;
  onView: (collectionName: string) => void;
  onDelete: (collectionName: string) => void;
}

export function CollectionCard({ collection, onView, onDelete }: CollectionCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{collection.name}</CardTitle>
            <CardDescription>Created {formatDate(collection.created_at)}</CardDescription>
          </div>
          <Badge variant="secondary">{collection.num_documents} docs</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Fields:</p>
            <div className="flex flex-wrap gap-2">
              {collection.fields.slice(0, 5).map((field) => (
                <Badge key={field.name} variant="outline">
                  {field.name}: {field.type}
                </Badge>
              ))}
              {collection.fields.length > 5 && (
                <Badge variant="outline">+{collection.fields.length - 5} more</Badge>
              )}
            </div>
          </div>
          {collection.default_sorting_field && (
            <div>
              <p className="text-sm text-muted-foreground">
                Default sort:{' '}
                <span className="font-medium">{collection.default_sorting_field}</span>
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(collection.name)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(collection.name)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
