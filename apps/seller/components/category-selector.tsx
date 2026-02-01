'use client';

import { useState, useMemo } from 'react';
import type { ParentCategory } from '@workspace/contracts';
import {
  Card,
  Button,
  Input,
  Badge,
  Alert,
  AlertDescription,
} from '@workspace/ui';

interface CategorySelectorProps {
  categories: ParentCategory[];
  selectedCategoryId?: string | null;
  onSelect: (categoryId: string) => void;
  disabled?: boolean;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  disabled = false,
}: CategorySelectorProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Find the parent of the currently selected category
  const currentParent = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((parent) =>
      parent.children.some((child) => child.id === selectedCategoryId)
    );
  }, [selectedCategoryId, categories]);

  // Auto-select parent if a category is pre-selected
  const activeParentId = selectedParentId || currentParent?.id || null;

  // Get active parent's children
  const activeChildren = useMemo(() => {
    if (!activeParentId) return [];
    const parent = categories.find((p) => p.id === activeParentId);
    return parent?.children || [];
  }, [activeParentId, categories]);

  // Filter children by search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim()) return activeChildren;
    const query = searchQuery.toLowerCase();
    return activeChildren.filter((child) =>
      child.name.toLowerCase().includes(query)
    );
  }, [activeChildren, searchQuery]);

  const handleParentClick = (parentId: string) => {
    setSelectedParentId(parentId);
    setSearchQuery('');
  };

  const handleChildClick = (childId: string) => {
    onSelect(childId);
  };

  return (
    <div className='space-y-6'>
      {/* Parent Category Selection */}
      <div>
        <h3 className='text-lg font-semibold text-foreground mb-3'>
          1. Select Category Type
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3'>
          {categories.map((parent) => {
            const isActive = activeParentId === parent.id;
            const childCount = parent.children.length;

            return (
              <button
                key={parent.id}
                onClick={() => handleParentClick(parent.id)}
                disabled={disabled}
                className={`
                  relative p-4 rounded-lg border-2 transition-all text-left
                  ${
                    isActive
                      ? 'border-ring bg-accent'
                      : 'border-border bg-card hover:border-ring hover:bg-accent'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className='font-medium text-foreground mb-1'>
                  {parent.name}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {childCount} {childCount === 1 ? 'option' : 'options'}
                </div>
                {isActive && (
                  <div className='absolute top-2 right-2'>
                    <div className='w-5 h-5 rounded-full bg-ring flex items-center justify-center'>
                      <svg
                        className='w-3 h-3 text-background'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Child Category Selection */}
      {activeParentId && (
        <div>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-lg font-semibold text-foreground'>
              2. Select Specific Category
            </h3>
            {activeChildren.length > 5 && (
              <Input
                type='text'
                placeholder='Search categories...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={disabled}
                className='max-w-xs'
              />
            )}
          </div>

          {filteredChildren.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
              {filteredChildren.map((child) => {
                const isSelected = selectedCategoryId === child.id;

                return (
                  <Card
                    key={child.id}
                    className={`
                      p-4 cursor-pointer transition-all border-2
                      ${
                        isSelected
                          ? 'border-ring bg-accent'
                          : 'border-border hover:border-ring hover:bg-accent'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !disabled && handleChildClick(child.id)}
                  >
                    <div className='flex items-center justify-between'>
                      <span className='font-medium text-foreground'>
                        {child.name}
                      </span>
                      {isSelected && (
                        <Badge variant='default'>Selected</Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No categories found matching "{searchQuery}"
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Instruction when no parent selected */}
      {!activeParentId && (
        <Alert>
          <AlertDescription>
            Select a category type above to see specific categories
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
