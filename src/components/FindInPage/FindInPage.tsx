import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

interface FindInPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FindInPage({ isOpen, onClose }: FindInPageProps) {
  const [searchText, setSearchText] = useState('');
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const clearHighlights = useCallback(() => {
    // Remove all highlights
    const highlights = document.querySelectorAll('.find-in-page-highlight');
    highlights.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });
    setCurrentMatch(0);
    setTotalMatches(0);
  }, []);

  const highlightText = useCallback((text: string) => {
    if (!text.trim()) {
      clearHighlights();
      return;
    }

    clearHighlights();

    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const textNodes: Node[] = [];
    const walker = document.createTreeWalker(
      mainContent,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script and style elements
          const parent = node.parentElement;
          if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
            return NodeFilter.FILTER_REJECT;
          }
          // Only accept nodes with actual text content
          if (node.textContent && node.textContent.trim().length > 0) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_REJECT;
        },
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    const searchRegex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let matchCount = 0;

    textNodes.forEach((node) => {
      const textContent = node.textContent || '';
      const matches = Array.from(textContent.matchAll(searchRegex));

      if (matches.length > 0) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matches.forEach((match) => {
          const matchIndex = match.index!;
          const matchText = match[0];

          // Add text before match
          if (matchIndex > lastIndex) {
            fragment.appendChild(
              document.createTextNode(textContent.substring(lastIndex, matchIndex))
            );
          }

          // Add highlighted match
          const highlight = document.createElement('span');
          highlight.className = 'find-in-page-highlight';
          highlight.textContent = matchText;
          highlight.style.backgroundColor = '#ffeb3b';
          highlight.style.color = '#000';
          highlight.style.padding = '2px 0';
          highlight.setAttribute('data-match-index', matchCount.toString());
          fragment.appendChild(highlight);

          matchCount++;
          lastIndex = matchIndex + matchText.length;
        });

        // Add remaining text
        if (lastIndex < textContent.length) {
          fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
        }

        node.parentNode?.replaceChild(fragment, node);
      }
    });

    setTotalMatches(matchCount);
    if (matchCount > 0) {
      setCurrentMatch(1);
      scrollToMatch(0);
    }
  }, [clearHighlights]);

  const scrollToMatch = (index: number) => {
    const highlights = document.querySelectorAll('.find-in-page-highlight');
    if (highlights.length === 0) return;

    // Remove previous active highlight
    highlights.forEach((el) => {
      el.classList.remove('find-in-page-active');
      (el as HTMLElement).style.backgroundColor = '#ffeb3b';
    });

    // Add active class to current match
    const currentHighlight = highlights[index] as HTMLElement;
    if (currentHighlight) {
      currentHighlight.classList.add('find-in-page-active');
      currentHighlight.style.backgroundColor = '#ff9800';
      currentHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    if (totalMatches === 0) return;
    const next = currentMatch >= totalMatches ? 1 : currentMatch + 1;
    setCurrentMatch(next);
    scrollToMatch(next - 1);
  };

  const handlePrevious = () => {
    if (totalMatches === 0) return;
    const prev = currentMatch <= 1 ? totalMatches : currentMatch - 1;
    setCurrentMatch(prev);
    scrollToMatch(prev - 1);
  };

  const handleClose = () => {
    clearHighlights();
    setSearchText('');
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      clearHighlights();
      setSearchText('');
    }
  }, [isOpen, clearHighlights]);

  useEffect(() => {
    if (isOpen && searchText) {
      const timer = setTimeout(() => {
        highlightText(searchText);
      }, 300);
      return () => clearTimeout(timer);
    } else if (isOpen && !searchText) {
      clearHighlights();
    }
  }, [searchText, isOpen, highlightText, clearHighlights]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2 min-w-[320px]">
      <Input
        type="text"
        placeholder="Find in page..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="flex-1"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.shiftKey) {
              handlePrevious();
            } else {
              handleNext();
            }
          } else if (e.key === 'Escape') {
            handleClose();
          }
        }}
      />
      {totalMatches > 0 && (
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          {currentMatch} / {totalMatches}
        </div>
      )}
      <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={totalMatches === 0}>
        <ChevronUp className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleNext} disabled={totalMatches === 0}>
        <ChevronDown className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={handleClose}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
