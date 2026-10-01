import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

interface ToolEmptyStateProps {
  query?: string;
  category?: string;
  onReset: () => void;
}

export function ToolEmptyState({ query, category, onReset }: ToolEmptyStateProps) {
  return (
    <Empty className="py-16 border border-dashed border-border rounded-xl bg-card/40 my-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX className="w-5 h-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No tools found</EmptyTitle>
        <EmptyDescription>
          {query ? (
            <>
              No tools matching &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;
              {category && category !== 'All' ? ` in ${category}` : ''}. Try broadening your search.
            </>
          ) : (
            <>No tools currently listed in this category.</>
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </Button>
      </EmptyContent>
    </Empty>
  );
}
