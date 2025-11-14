import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection';

const aliasSchema = z.object({
  name: z
    .string()
    .min(1, 'Alias name is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, underscore, and hyphen allowed'),
  collection_name: z.string().min(1, 'Target collection is required'),
});

type AliasFormData = z.infer<typeof aliasSchema>;

interface CreateAliasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AliasFormData) => Promise<void>;
  collections: CollectionSchema[];
}

export function CreateAliasDialog({
  open,
  onOpenChange,
  onSubmit,
  collections,
}: CreateAliasDialogProps) {
  const form = useForm<AliasFormData>({
    resolver: zodResolver(aliasSchema),
    defaultValues: {
      name: '',
      collection_name: '',
    },
  });

  const handleSubmit = async (data: AliasFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Error creating alias:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Collection Alias</DialogTitle>
          <DialogDescription>
            Create an alias that points to an existing collection. Aliases allow you to reference
            collections by alternate names.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Alias Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., products, articles, users"
                      {...field}
                      disabled={form.formState.isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Collection */}
            <FormField
              control={form.control}
              name="collection_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Collection</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={form.formState.isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {collections.map((collection) => (
                        <SelectItem key={collection.name} value={collection.name}>
                          {collection.name} ({collection.num_documents} docs)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Alias
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
