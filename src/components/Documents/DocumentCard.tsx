import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { isImageUrl } from '@/lib/imageUtils';

interface DocumentCardProps {
  document: Record<string, any>;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DocumentCard({
  document,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (url: string) => {
    setImageErrors((prev) => new Set(prev).add(url));
  };

  return (
    <div
      className={`border rounded-lg bg-card hover:shadow-lg h-full transition-shadow duration-200 overflow-hidden flex flex-col ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : ''
      }`}
    >
      {/* Header with selection checkbox and actions */}
      <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
        <button onClick={onToggleSelect} className="flex items-center gap-2">
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-primary" />
          ) : (
            <Square className="w-5 h-5 text-muted-foreground hover:text-primary" />
          )}
          <span className="font-mono text-xs text-muted-foreground">ID: {document.id}</span>
        </button>

        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 overflow-hidden">
        {/* Document Fields */}
        <div className="space-y-3">
          {Object.entries(document).map(([key, value]) => {
            // Handle arrays
            if (Array.isArray(value)) {
              return (
                <div key={key} className="text-sm">
                  <div className="font-medium text-muted-foreground mb-1">{key}:</div>
                  <div className="text-foreground">
                    {value.map((item, idx) => (
                      <span key={idx}>
                        {idx > 0 && ', '}
                        {isImageUrl(item) && !imageErrors.has(item) ? (
                          <div className="mt-1">
                            <div className="text-xs text-muted-foreground break-all mb-1">
                              {item}
                            </div>
                            <img
                              src={item}
                              alt={`${key} image`}
                              className="rounded"
                              style={{ maxWidth: '200px', maxHeight: '200px' }}
                              onError={() => handleImageError(item)}
                            />
                          </div>
                        ) : isImageUrl(item) ? (
                          <a
                            href={item}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            [image]
                          </a>
                        ) : (
                          String(item)
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }

            // Handle objects
            if (value && typeof value === 'object') {
              return (
                <div key={key} className="text-sm">
                  <div className="font-medium text-muted-foreground mb-1">{key}:</div>
                  <div className="text-foreground">{JSON.stringify(value)}</div>
                </div>
              );
            }

            // Handle image URLs
            if (isImageUrl(value) && !imageErrors.has(value as string)) {
              return (
                <div key={key} className="text-sm">
                  <div className="font-medium text-muted-foreground mb-1">{key}:</div>
                  <div className="text-xs text-muted-foreground break-all mb-1">
                    {value as string}
                  </div>
                  <div>
                    <img
                      src={value as string}
                      alt={key}
                      className="rounded"
                      style={{ maxWidth: '200px', maxHeight: '200px' }}
                      onError={() => handleImageError(value as string)}
                    />
                  </div>
                </div>
              );
            }

            // Handle regular values (including failed image URLs)
            return (
              <div key={key} className="text-sm">
                <div className="font-medium text-muted-foreground mb-1">{key}:</div>
                <div className="text-foreground break-words">{String(value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
