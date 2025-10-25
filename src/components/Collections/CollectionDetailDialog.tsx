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
import { Check, X, BarChart3 } from 'lucide-react';

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
      <DialogContent className="!max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
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
            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Documents</p>
                <p className="text-2xl font-bold">{collection.num_documents.toLocaleString()}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Fields</p>
                <p className="text-2xl font-bold">{collection.fields?.length || 0}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Created</p>
                <p className="text-2xl font-bold">
                  {new Date(collection.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Field Type Distribution */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4" />
                <h3 className="font-semibold">Field Type Distribution</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  collection.fields.reduce(
                    (acc, field) => {
                      acc[field.type] = (acc[field.type] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  )
                ).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Collection Configuration */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {collection.default_sorting_field && (
                  <div>
                    <p className="text-muted-foreground">Default Sorting Field</p>
                    <Badge variant="secondary" className="mt-1">
                      {collection.default_sorting_field}
                    </Badge>
                  </div>
                )}
                {collection.token_separators && collection.token_separators.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">Token Separators</p>
                    <p className="font-medium mt-1">
                      {collection.token_separators.map((sep) => `"${sep}"`).join(', ')}
                    </p>
                  </div>
                )}
                {collection.symbols_to_index && collection.symbols_to_index.length > 0 && (
                  <div>
                    <p className="text-muted-foreground">Indexed Symbols</p>
                    <p className="font-medium mt-1">
                      {collection.symbols_to_index.map((sym) => `"${sym}"`).join(', ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Enable Nested Fields</p>
                  <p className="font-medium mt-1">
                    {collection.enable_nested_fields ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Schema ({collection.fields.length} fields)
              </h3>
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
                    {collection.fields
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((field) => (
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
