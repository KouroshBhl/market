import { Injectable } from '@nestjs/common';
import type { CategoriesResponse, ParentCategory } from '@workspace/contracts';
import { getActiveCategoriesWithChildren, validateChildCategory } from '@workspace/db';

@Injectable()
export class CategoriesService {
  /**
   * Fetch all active categories grouped by parent
   * Returns parent categories with their child categories nested
   */
  async getActiveCategories(): Promise<CategoriesResponse> {
    const parents = await getActiveCategoriesWithChildren();
    
    return {
      parents: parents as ParentCategory[],
    };
  }

  /**
   * Validate that a category ID is a valid child category
   * Used when creating/updating products
   */
  async validateChildCategory(categoryId: string): Promise<boolean> {
    return validateChildCategory(categoryId);
  }
}
