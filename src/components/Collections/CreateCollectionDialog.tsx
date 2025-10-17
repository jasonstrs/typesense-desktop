import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { CollectionFieldSchema } from 'typesense/lib/Typesense/Collection';

const FIELD_TYPES = [
  'string',
  'int32',
  'int64',
  'float',
  'bool',
  'geopoint',
  'geopolygon',
  'geopoint[]',
  'string[]',
  'int32[]',
  'int64[]',
  'float[]',
  'bool[]',
  'object',
  'object[]',
  'auto',
  'string*',
  'image',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];
export const FieldTypeSchema = z.enum(FIELD_TYPES);

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: FieldTypeSchema,
  facet: z.boolean().optional(),
  optional: z.boolean().optional(),
  index: z.boolean().optional(),
});

const collectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, underscore, and hyphen allowed'),
  fields: z.array(fieldSchema).min(1, 'At least one field is required'),
  default_sorting_field: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CollectionCreateSchema) => Promise<void>;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateCollectionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: '',
      fields: [{ name: 'id', type: 'string', index: true }],
      default_sorting_field: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  const handleSubmit = async (data: CollectionFormData) => {
    setIsSubmitting(true);
    try {
      // Clean up fields by removing undefined optional properties
      const cleanedFields = data.fields.map((field) => {
        const cleanField: CollectionFieldSchema = {
          name: field.name,
          type: field.type,
        };
        if (field.facet !== undefined) cleanField.facet = field.facet;
        if (field.optional !== undefined) cleanField.optional = field.optional;
        if (field.index !== undefined) cleanField.index = field.index;
        return cleanField;
      });

      const request: CollectionCreateSchema = {
        name: data.name,
        fields: cleanedFields,
      };

      if (data.default_sorting_field) {
        request.default_sorting_field = data.default_sorting_field;
      }

      await onSubmit(request);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Define your collection schema with fields and their types.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection Name</FormLabel>
                  <FormControl>
                    <Input placeholder="my_collection" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex justify-between items-center mb-4">
                <FormLabel>Fields</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', type: 'string', index: true })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name={`fields.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="field_name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mt-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name={`fields.${index}.facet`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="w-4 h-4"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Facet</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.optional`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="w-4 h-4"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Optional</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fields.${index}.index`}
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="w-4 h-4"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Index</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="default_sorting_field"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Sorting Field (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Leave empty for none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Collection
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
