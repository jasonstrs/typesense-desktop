import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection } from '@/hooks/useCollections';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X } from 'lucide-react';

interface CollectionDetailDialogProps {
  collectionName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollectionDetailDialog({
  collectionName,
  open,
  onOpenChange,
}: CollectionDetailDialogProps) {
  const { data: collection, isLoading } = useCollection(collectionName || '');

  if (!collectionName) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{collectionName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : collection ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="text-2xl font-bold">{collection.num_documents.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-2xl font-bold">
                  {new Date(collection.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>

            {collection.default_sorting_field && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Default Sorting Field</p>
                <Badge variant="secondary">{collection.default_sorting_field}</Badge>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">Schema</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Facet</TableHead>
                      <TableHead className="text-center">Optional</TableHead>
                      <TableHead className="text-center">Index</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collection.fields.map((field) => (
                      <TableRow key={field.name}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.type}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {field.facet ? (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {field.optional ? (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {field.index !== false ? (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">Collection not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
