"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDirectorCategories = exports.getAllCategories = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const getAllCategories = async () => {
    try {
        const { data: categories, error } = await supabase_1.default
            .from('categories')
            .select('id, name');
        if (error) {
            throw new Error(`Failed to fetch categories: ${error.message}`);
        }
        // Map database categories to Category interface (adding default emojis)
        const categoryEmojis = {
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
    }
    catch (error) {
        throw new Error(`Failed to fetch categories: ${error}`);
    }
};
exports.getAllCategories = getAllCategories;
const saveDirectorCategories = async (authUserId, request) => {
    try {
        const { category_ids } = request;
        if (!category_ids || category_ids.length === 0) {
            throw new Error('At least one category must be selected');
        }
        // Remove duplicates from input
        const uniqueCategoryIds = [...new Set(category_ids)];
        // First, get the director ID from the directors table using the auth user ID
        const { data: directorData, error: directorError } = await supabase_1.default
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
        const { data: validCategories, error: validationError } = await supabase_1.default
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
        const { data: existingRelations, error: fetchError } = await supabase_1.default
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
            const { error: insertError } = await supabase_1.default
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
    }
    catch (error) {
        throw new Error(`Failed to save director categories: ${error}`);
    }
};
exports.saveDirectorCategories = saveDirectorCategories;
