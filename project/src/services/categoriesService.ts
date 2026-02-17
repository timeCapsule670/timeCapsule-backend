import supabase from '../config/supabase';
import { Category, SaveCategoriesRequest } from '../types/categories';

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name');

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    // Map database categories to Category interface (adding default emojis)
    const categoryEmojis: { [key: string]: string } = {
      'Life Advice': '💬',
      'Celebrations and Encouragement': '🎉',
      'Milestones': '🎓',
      'Emotional Support': '😊',
      'Just Because': '❤️'
    };

    return categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      emoji: categoryEmojis[cat.name] || '📝' // Default emoji if name not found
    })) || [];
  } catch (error) {
    throw new Error(`Failed to fetch categories: ${error}`);
  }
};

export const getCategoryNamesByIds = async (ids: string[]): Promise<string[]> => {
  if (!ids || ids.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to fetch category names: ${error.message}`);
    }
    return (data ?? []).map(c => c.name);
  } catch (error) {
    throw new Error(`Failed to fetch category names: ${error}`);
  }
};

export const getDirectorCategoryNames = async (authUserId: string): Promise<string[]> => {
  try {
    const { data: directorData, error: directorError } = await supabase
      .from('directors')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (directorError || !directorData) return [];

    const { data: relations, error: relError } = await supabase
      .from('director_categories')
      .select('category_id')
      .eq('director_id', directorData.id);

    if (relError || !relations?.length) return [];

    const categoryIds = relations.map(r => r.category_id);
    return getCategoryNamesByIds(categoryIds);
  } catch {
    return [];
  }
};

export const saveDirectorCategories = async (
  authUserId: string, 
  request: SaveCategoriesRequest
): Promise<{ saved_count: number; existing_count: number }> => {
  try {
    const { category_ids } = request;
    
    if (!category_ids || category_ids.length === 0) {
      throw new Error('At least one category must be selected');
    }

    // Remove duplicates from input
    const uniqueCategoryIds = [...new Set(category_ids)];

    // First, get the director ID from the directors table using the auth user ID
    const { data: directorData, error: directorError } = await supabase
      .from('directors')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    if (directorError) {
      throw new Error(`Failed to find director profile: ${directorError.message}`);
    }

    if (!directorData) {
      throw new Error('Director profile not found');
    }

    const directorId = directorData.id;

    // Validate that all category IDs exist in the database
    const { data: validCategories, error: validationError } = await supabase
      .from('categories')
      .select('id')
      .in('id', uniqueCategoryIds);

    if (validationError) {
      throw new Error(`Failed to validate categories: ${validationError.message}`);
    }

    if (!validCategories || validCategories.length !== uniqueCategoryIds.length) {
      const foundIds = validCategories?.map(cat => cat.id) || [];
      const invalidIds = uniqueCategoryIds.filter(id => !foundIds.includes(id));
      throw new Error(`Invalid category IDs: ${invalidIds.join(', ')}`);
    }

    // Check for existing relationships
    const { data: existingRelations, error: fetchError } = await supabase
      .from('director_categories')
      .select('category_id')
      .eq('director_id', directorId)
      .in('category_id', uniqueCategoryIds);

    if (fetchError) {
      throw new Error(`Failed to check existing categories: ${fetchError.message}`);
    }

    const existingCategoryIds = existingRelations?.map(rel => rel.category_id) || [];
    const newCategoryIds = uniqueCategoryIds.filter(id => !existingCategoryIds.includes(id));

    let savedCount = 0;
    let existingCount = existingCategoryIds.length;

    // Insert new relationships
    if (newCategoryIds.length > 0) {
      const newRelations = newCategoryIds.map(categoryId => ({
        director_id: directorId,
        category_id: categoryId,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('director_categories')
        .insert(newRelations);

      if (insertError) {
        throw new Error(`Failed to save categories: ${insertError.message}`);
      }

      savedCount = newCategoryIds.length;
    }

    return {
      saved_count: savedCount,
      existing_count: existingCount
    };
  } catch (error) {
    throw new Error(`Failed to save director categories: ${error}`);
  }
};
