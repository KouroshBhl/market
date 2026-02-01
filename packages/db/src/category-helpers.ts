import { prisma } from './index';

/**
 * Category with children for two-step selector UI
 */
export interface ParentCategoryWithChildren {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  children: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
}

/**
 * Fetch all active parent categories with their active children
 * Ordered by sortOrder for clean UI presentation
 * 
 * Used by seller UI for two-step category selection:
 * 1. User picks parent category
 * 2. User picks child category from filtered list
 */
export async function getActiveCategoriesWithChildren(): Promise<ParentCategoryWithChildren[]> {
  const parents = await prisma.category.findMany({
    where: {
      isActive: true,
      parentId: null, // Only parent categories
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
      children: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      },
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  return parents;
}

/**
 * Validate that a category is a valid child category (not a parent)
 * Used when creating/updating products to ensure products only reference children
 */
export async function validateChildCategory(categoryId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      parentId: true,
      isActive: true,
    },
  });

  // Must exist, be active, and have a parent (be a child category)
  return category !== null && category.isActive && category.parentId !== null;
}

/**
 * Application-level validation to prevent nesting deeper than 2 levels
 * Call this before creating a category with a parent
 */
export async function validateMaxDepth(parentId: string | null): Promise<void> {
  if (!parentId) return; // Root level is OK

  const parent = await prisma.category.findUnique({
    where: { id: parentId },
    select: {
      parentId: true,
      name: true,
    },
  });

  if (parent?.parentId) {
    throw new Error(
      `Category depth limit exceeded: Cannot nest categories more than 2 levels deep. ` +
      `Parent "${parent.name}" already has a parent.`
    );
  }
}
