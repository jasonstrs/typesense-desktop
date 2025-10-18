import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (document: Record<string, any>) => Promise<void>;
  initialData?: Record<string, any>;
  mode: 'add' | 'edit';
  collectionName: string;
}

export function DocumentDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  collectionName,
}: DocumentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (initialData) {
      setJsonContent(JSON.stringify(initialData, null, 2));
    } else {
      setJsonContent('{\n  "id": "",\n  \n}');
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJsonError('');

    try {
      const parsedData = JSON.parse(jsonContent);

      if (mode === 'add' && !parsedData.id) {
        setJsonError('Document must have an "id" field');
        return;
      }

      setIsSubmitting(true);
      await onSubmit(parsedData);
      onOpenChange(false);
      setJsonContent('{\n  "id": "",\n  \n}');
    } catch (error) {
      if (error instanceof SyntaxError) {
        setJsonError('Invalid JSON: ' + error.message);
      } else {
        toast.error('Failed to save document');
        console.error(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Document' : 'Edit Document'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? `Add a new document to the "${collectionName}" collection. Provide the document data as JSON.`
              : `Edit the document in the "${collectionName}" collection.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Document JSON</label>
            <textarea
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setJsonError('');
              }}
              className="w-full h-96 p-4 font-mono text-sm border rounded-md resize-none"
              placeholder='{\n  "id": "1",\n  "name": "Example"\n}'
            />
            {jsonError && <p className="text-sm text-destructive mt-2">{jsonError}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'add' ? 'Add Document' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
