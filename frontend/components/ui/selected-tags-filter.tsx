'use client';

import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {X} from 'lucide-react';
import {motion} from 'motion/react';

interface SelectedTagsFilterProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAllFilters: () => void;
  className?: string;
}

export function SelectedTagsFilter({
  selectedTags,
  onTagToggle,
  onClearAllFilters,
  className = '',
}: SelectedTagsFilterProps) {
  if (!selectedTags.length) {
    return null;
  }

  const itemVariants = {
    hidden: {opacity: 0, y: 15},
    visible: {
      opacity: 1,
      y: 0,
      transition: {duration: 0.5, ease: 'easeOut'},
    },
  };

  return (
    <motion.div
      className={`flex items-center flex-wrap gap-2 ${className}`}
      variants={itemVariants}
    >
      <span className="text-xs text-muted-foreground">筛选条件:</span>
      {selectedTags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className="px-2 py-0 h-6 bg-primary/5 text-primary border-primary/20 select-none cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => onTagToggle(tag)}
        >
          {tag}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground"
        onClick={onClearAllFilters}
      >
        清除全部
      </Button>
    </motion.div>
  );
}
