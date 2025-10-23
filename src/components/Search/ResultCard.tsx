import { isImageUrl } from '@/lib/imageUtils';
import { useState } from 'react';

interface ResultCardProps {
  document: Record<string, any>;
  score?: number;
  searchQuery?: string;
}

export function ResultCard({ document, score, searchQuery }: ResultCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (url: string) => {
    setImageErrors((prev) => new Set(prev).add(url));
  };

  const highlightText = (text: string, query?: string): React.ReactNode => {
    if (!query || !text) return text;

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = String(text).split(regex);

    return parts.map((part, index) => {
      // Check if this part matches the query (case-insensitive)
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <div className="border rounded-lg h-full bg-card hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col">
      {/* Content Section */}
      <div className="p-4 flex-1">
        {/* Score Badge */}
        {score !== undefined && (
          <div className="mb-3">
            <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              Score: {score}
            </span>
          </div>
        )}

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
                          highlightText(String(item), searchQuery)
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
                <div className="text-foreground">{highlightText(String(value), searchQuery)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
