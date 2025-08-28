"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildProfileService = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const errorHandler_1 = require("../middleware/errorHandler");
class ChildProfileService {
    /**
     * Simple username generation matching frontend logic exactly
     */
    static generateSimpleUsername(firstName) {
        const cleanName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const timestamp = Date.now().toString().slice(-6);
        return `${cleanName}${timestamp}`;
    }
    /**
     * Creates child profiles with full setup flow - matches frontend logic exactly
     */
    static async createChildProfiles(authUserId, request) {
        try {
            // Step 1: Process frontend data exactly like frontend does
            const actorsToInsert = request.children.map(child => {
                const firstName = child.name.trim();
                // Convert MM/DD/YYYY to ISO format (YYYY-MM-DD)
                let dateOfBirth;
                if (child.birthdayDate) {
                    // If birthdayDate is provided, use it
                    dateOfBirth = child.birthdayDate.toISOString().split('T')[0];
                }
                else if (child.birthday) {
                    // If only birthday string is provided, parse it
                    const parts = child.birthday.split('/');
                    if (parts.length === 3) {
                        const month = parseInt(parts[0], 10);
                        const day = parseInt(parts[1], 10);
                        const year = parseInt(parts[2], 10);
                        dateOfBirth = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    }
                    else {
                        throw new errorHandler_1.ApiError(400, `Invalid birthday format for ${firstName}. Expected MM/DD/YYYY`);
                    }
                }
                else {
                    throw new errorHandler_1.ApiError(400, `Birthday is required for ${firstName}`);
                }
                const generatedUsername = child.username || this.generateSimpleUsername(firstName);
                return {
                    first_name: firstName,
                    last_name: '', // Empty string as it's not collected in the UI
                    date_of_birth: dateOfBirth,
                    gender: null, // Not collected in current UI
                    notes: null, // Not collected in current UI
                    username: generatedUsername,
                };
            });
            // Step 2: Insert actors (children) first - exactly like frontend
            const actors = await this.insertActors(actorsToInsert);
            // Step 3: Get the director profile for the current user - exactly like frontend
            const director = await this.getOrCreateDirector(authUserId);
            // Step 4: Create director-actor relationships immediately - exactly like frontend
            const relationships = await this.createRelationships(director.id, actors);
            return {
                actors,
                relationships,
                message: 'Child profiles created successfully',
                nextStep: 'family_setup',
                actorIds: actors.map(actor => actor.id) // Frontend needs these for next step
            };
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Child profile creation failed: ${error.message}`);
        }
    }
    /**
     * Inserts actors (child profiles) into the database
     */
    static async insertActors(actorsToInsert) {
        try {
            // Log what we're trying to insert
            console.log('Attempting to insert actors:', JSON.stringify(actorsToInsert, null, 2));
            const { data, error } = await supabase_1.default
                .from('actors')
                .insert(actorsToInsert)
                .select()
                .order('created_at', { ascending: true });
            if (error) {
                // Log the actual error for debugging
                console.error('Database error details:', {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                });
                // Match frontend error handling exactly
                if (error.code === '42501') {
                    throw new errorHandler_1.ApiError(403, 'Permission denied. Please check your account permissions and try again.');
                }
                else if (error.code === '23505') {
                    throw new errorHandler_1.ApiError(409, 'A child with this information already exists. Please check the details and try again.');
                }
                else if (error.message.includes('row-level security')) {
                    throw new errorHandler_1.ApiError(403, 'Security policy violation. Please contact support if this issue persists.');
                }
                else if (error.code === '23503') {
                    throw new errorHandler_1.ApiError(400, 'Invalid reference data provided.');
                }
                throw new errorHandler_1.ApiError(500, `Failed to save child profiles: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Actor insertion failed: ${error.message}`);
        }
    }
    /**
     * Gets or creates a director profile for the authenticated user
     */
    static async getOrCreateDirector(authUserId) {
        try {
            // First try to get existing director profile
            let { data: director, error: fetchError } = await supabase_1.default
                .from('directors')
                .select('*')
                .eq('auth_user_id', authUserId)
                .single();
            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw new errorHandler_1.ApiError(500, `Failed to fetch director profile: ${fetchError.message}`);
            }
            // If director doesn't exist, create one
            if (!director) {
                const { data: newDirector, error: createError } = await supabase_1.default
                    .from('directors')
                    .insert({
                    auth_user_id: authUserId,
                    director_type: 'Parent' // Default type
                })
                    .select()
                    .single();
                if (createError) {
                    throw new errorHandler_1.ApiError(500, `Failed to create director profile: ${createError.message}`);
                }
                director = newDirector;
            }
            return director;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Director profile handling failed: ${error.message}`);
        }
    }
    /**
     * Creates relationships between director and actors
     */
    static async createRelationships(directorId, actors) {
        try {
            const relationships = actors.map(actor => ({
                director_id: directorId,
                actor_id: actor.id,
                relationship: 'Child' // Default relationship type
            }));
            const { data, error } = await supabase_1.default
                .from('director_actor')
                .insert(relationships)
                .select()
                .order('created_at', { ascending: true });
            if (error) {
                if (error.code === '23503') { // Foreign key constraint violation
                    throw new errorHandler_1.ApiError(400, 'Invalid director or actor reference.');
                }
                throw new errorHandler_1.ApiError(500, `Failed to create relationships: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Relationship creation failed: ${error.message}`);
        }
    }
    /**
     * Gets all child profiles for a director
     */
    static async getChildProfilesByDirector(authUserId) {
        try {
            // Get director profile
            const { data: director, error: directorError } = await supabase_1.default
                .from('directors')
                .select('id')
                .eq('auth_user_id', authUserId)
                .single();
            if (directorError) {
                throw new errorHandler_1.ApiError(404, 'Director profile not found');
            }
            // Get relationships
            const { data: relationships, error: relError } = await supabase_1.default
                .from('director_actor')
                .select('*')
                .eq('director_id', director.id);
            if (relError) {
                throw new errorHandler_1.ApiError(500, `Failed to fetch relationships: ${relError.message}`);
            }
            // Get actors
            if (relationships && relationships.length > 0) {
                const actorIds = relationships.map(rel => rel.actor_id);
                const { data: actors, error: actorsError } = await supabase_1.default
                    .from('actors')
                    .select('*')
                    .in('id', actorIds)
                    .order('first_name', { ascending: true });
                if (actorsError) {
                    throw new errorHandler_1.ApiError(500, `Failed to fetch actors: ${actorsError.message}`);
                }
                return { actors: actors || [], relationships: relationships || [] };
            }
            return { actors: [], relationships: [] };
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Failed to retrieve child profiles: ${error.message}`);
        }
    }
    /**
     * Updates a child profile
     */
    static async updateChildProfile(actorId, authUserId, updateData) {
        try {
            // Verify ownership through director relationship
            const { data: relationship, error: relError } = await supabase_1.default
                .from('director_actor')
                .select('director_id')
                .eq('actor_id', actorId)
                .eq('director.auth_user_id', authUserId)
                .single();
            if (relError || !relationship) {
                throw new errorHandler_1.ApiError(403, 'You do not have permission to update this child profile');
            }
            // Update the actor
            const { data, error } = await supabase_1.default
                .from('actors')
                .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
                .eq('id', actorId)
                .select()
                .single();
            if (error) {
                throw new errorHandler_1.ApiError(500, `Failed to update child profile: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Child profile update failed: ${error.message}`);
        }
    }
    /**
     * Deletes a child profile and its relationships
     */
    static async deleteChildProfile(actorId, authUserId) {
        try {
            // Verify ownership through director relationship
            const { data: relationship, error: relError } = await supabase_1.default
                .from('director_actor')
                .select('director_id')
                .eq('actor_id', actorId)
                .eq('director.auth_user_id', authUserId)
                .single();
            if (relError || !relationship) {
                throw new errorHandler_1.ApiError(403, 'You do not have permission to delete this child profile');
            }
            // Delete relationships first
            const { error: relDeleteError } = await supabase_1.default
                .from('director_actor')
                .delete()
                .eq('actor_id', actorId);
            if (relDeleteError) {
                throw new errorHandler_1.ApiError(500, `Failed to delete relationships: ${relDeleteError.message}`);
            }
            // Delete the actor
            const { error: actorDeleteError } = await supabase_1.default
                .from('actors')
                .delete()
                .eq('id', actorId);
            if (actorDeleteError) {
                throw new errorHandler_1.ApiError(500, `Failed to delete child profile: ${actorDeleteError.message}`);
            }
        }
        catch (error) {
            if (error instanceof errorHandler_1.ApiError) {
                throw error;
            }
            throw new errorHandler_1.ApiError(500, `Child profile deletion failed: ${error.message}`);
        }
    }
}
exports.ChildProfileService = ChildProfileService;
