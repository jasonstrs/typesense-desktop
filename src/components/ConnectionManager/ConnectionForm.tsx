import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useConnectionStore } from '@/stores/connectionStore';
import { toast } from 'sonner';

const connectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  apiKey: z.string().min(1, 'API Key is required'),
  readOnly: z.boolean().optional(),
});

type ConnectionFormData = z.infer<typeof connectionSchema>;

interface ConnectionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ConnectionFormData) => Promise<void>;
  initialData?: Partial<ConnectionFormData>;
  mode?: 'create' | 'edit';
}

export function ConnectionForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}: ConnectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const { testConnection } = useConnectionStore();

  const form = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: initialData?.name || '',
      url: initialData?.url || '',
      apiKey: initialData?.apiKey || '',
      readOnly: initialData?.readOnly || false,
    },
  });

  // Reset form values when initialData changes (for edit mode)
  useEffect(() => {
    if (open) {
      form.reset({
        name: initialData?.name || '',
        url: initialData?.url || '',
        apiKey: initialData?.apiKey || '',
        readOnly: initialData?.readOnly || false,
      });
    }
  }, [open, initialData, form]);

  const handleTestConnection = async () => {
    // Validate form fields first
    const isValid = await form.trigger(['url', 'apiKey']);
    if (!isValid) {
      toast.error('Please fill in URL and API Key');
      return;
    }

    const url = form.getValues('url');
    const apiKey = form.getValues('apiKey');

    setIsTesting(true);
    setTestResult(null);

    try {
      const success = await testConnection(url, apiKey);
      if (success) {
        setTestResult('success');
        toast.success('Connection successful!');
      } else {
        setTestResult('error');
        toast.error('Connection failed. Please check your URL and API key.');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (data: ConnectionFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
      setTestResult(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save connection:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Connection' : 'Edit Connection'}</DialogTitle>
          <DialogDescription>
            Connect to a Typesense instance. Your API key will be stored securely.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Local Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="http://localhost:8108" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="readOnly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Read-Only Mode</FormLabel>
                    <FormDescription>
                      Prevent all write operations (create/delete collections, aliases, and
                      documents)
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {/* Test Connection Button */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isTesting && testResult === 'success' && (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                )}
                {!isTesting && testResult === 'error' && (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                )}
                Test Connection
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Add Connection' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
