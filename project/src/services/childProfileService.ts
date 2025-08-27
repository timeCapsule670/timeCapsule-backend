import supabase from '../config/supabase';
import { 
  Actor, 
  Director, 
  DirectorActorRelationship, 
  CreateChildProfileRequest,
  ChildProfileResponse 
} from '../types/children';
import { ApiError } from '../middleware/errorHandler';

export class ChildProfileService {
  /**
   * Simple username generation matching frontend logic exactly
   */
  private static generateSimpleUsername(firstName: string): string {
    const cleanName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now().toString().slice(-6);
    return `${cleanName}${timestamp}`;
  }

  /**
   * Creates child profiles with full setup flow - matches frontend logic exactly
   */
  static async createChildProfiles(
    authUserId: string, 
    request: CreateChildProfileRequest
  ): Promise<ChildProfileResponse> {
    try {
      // Step 1: Process frontend data exactly like frontend does
      const actorsToInsert = request.children.map(child => {
        const firstName = child.name.trim();
        
        // Convert MM/DD/YYYY to ISO format (YYYY-MM-DD)
        let dateOfBirth: string;
        if (child.birthdayDate) {
          // If birthdayDate is provided, use it
          dateOfBirth = child.birthdayDate.toISOString().split('T')[0];
        } else if (child.birthday) {
          // If only birthday string is provided, parse it
          const parts = child.birthday.split('/');
          if (parts.length === 3) {
            const month = parseInt(parts[0], 10);
            const day = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);
            dateOfBirth = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          } else {
            throw new ApiError(400, `Invalid birthday format for ${firstName}. Expected MM/DD/YYYY`);
          }
        } else {
          throw new ApiError(400, `Birthday is required for ${firstName}`);
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
      
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Child profile creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Inserts actors (child profiles) into the database
   */
  private static async insertActors(actorsToInsert: any[]): Promise<Actor[]> {
    try {
      // Log what we're trying to insert
      console.log('Attempting to insert actors:', JSON.stringify(actorsToInsert, null, 2));
      
      const { data, error } = await supabase
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
          throw new ApiError(403, 'Permission denied. Please check your account permissions and try again.');
        } else if (error.code === '23505') {
          throw new ApiError(409, 'A child with this information already exists. Please check the details and try again.');
        } else if (error.message.includes('row-level security')) {
          throw new ApiError(403, 'Security policy violation. Please contact support if this issue persists.');
        } else if (error.code === '23503') {
          throw new ApiError(400, 'Invalid reference data provided.');
        }
        throw new ApiError(500, `Failed to save child profiles: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Actor insertion failed: ${(error as Error).message}`);
    }
  }

  /**
   * Gets or creates a director profile for the authenticated user
   */
  private static async getOrCreateDirector(authUserId: string): Promise<Director> {
    try {
      // First try to get existing director profile
      let { data: director, error: fetchError } = await supabase
        .from('directors')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new ApiError(500, `Failed to fetch director profile: ${fetchError.message}`);
      }
      
      // If director doesn't exist, create one
      if (!director) {
        const { data: newDirector, error: createError } = await supabase
          .from('directors')
          .insert({
            auth_user_id: authUserId,
            director_type: 'Parent' // Default type
          })
          .select()
          .single();
        
        if (createError) {
          throw new ApiError(500, `Failed to create director profile: ${createError.message}`);
        }
        
        director = newDirector;
      }
      
      return director;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Director profile handling failed: ${(error as Error).message}`);
    }
  }

  /**
   * Creates relationships between director and actors
   */
  private static async createRelationships(
    directorId: string, 
    actors: Actor[]
  ): Promise<DirectorActorRelationship[]> {
    try {
      const relationships = actors.map(actor => ({
        director_id: directorId,
        actor_id: actor.id,
        relationship: 'Child' // Default relationship type
      }));
      
      const { data, error } = await supabase
        .from('director_actor')
        .insert(relationships)
        .select()
        .order('created_at', { ascending: true });
      
      if (error) {
        if (error.code === '23503') { // Foreign key constraint violation
          throw new ApiError(400, 'Invalid director or actor reference.');
        }
        throw new ApiError(500, `Failed to create relationships: ${error.message}`);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Relationship creation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Gets all child profiles for a director
   */
  static async getChildProfilesByDirector(authUserId: string): Promise<{
    actors: Actor[];
    relationships: DirectorActorRelationship[];
  }> {
    try {
      // Get director profile
      const { data: director, error: directorError } = await supabase
        .from('directors')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();
      
      if (directorError) {
        throw new ApiError(404, 'Director profile not found');
      }
      
      // Get relationships
      const { data: relationships, error: relError } = await supabase
        .from('director_actor')
        .select('*')
        .eq('director_id', director.id);
      
      if (relError) {
        throw new ApiError(500, `Failed to fetch relationships: ${relError.message}`);
      }
      
      // Get actors
      if (relationships && relationships.length > 0) {
        const actorIds = relationships.map(rel => rel.actor_id);
        const { data: actors, error: actorsError } = await supabase
          .from('actors')
          .select('*')
          .in('id', actorIds)
          .order('first_name', { ascending: true });
        
        if (actorsError) {
          throw new ApiError(500, `Failed to fetch actors: ${actorsError.message}`);
        }
        
        return { actors: actors || [], relationships: relationships || [] };
      }
      
      return { actors: [], relationships: [] };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to retrieve child profiles: ${(error as Error).message}`);
    }
  }

  /**
   * Updates a child profile
   */
  static async updateChildProfile(
    actorId: string,
    authUserId: string,
    updateData: any
  ): Promise<Actor> {
    try {
      // Verify ownership through director relationship
      const { data: relationship, error: relError } = await supabase
        .from('director_actor')
        .select('director_id')
        .eq('actor_id', actorId)
        .eq('director.auth_user_id', authUserId)
        .single();
      
      if (relError || !relationship) {
        throw new ApiError(403, 'You do not have permission to update this child profile');
      }
      
      // Update the actor
      const { data, error } = await supabase
        .from('actors')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', actorId)
        .select()
        .single();
      
      if (error) {
        throw new ApiError(500, `Failed to update child profile: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Child profile update failed: ${(error as Error).message}`);
    }
  }

  /**
   * Deletes a child profile and its relationships
   */
  static async deleteChildProfile(actorId: string, authUserId: string): Promise<void> {
    try {
      // Verify ownership through director relationship
      const { data: relationship, error: relError } = await supabase
        .from('director_actor')
        .select('director_id')
        .eq('actor_id', actorId)
        .eq('director.auth_user_id', authUserId)
        .single();
      
      if (relError || !relationship) {
        throw new ApiError(403, 'You do not have permission to delete this child profile');
      }
      
      // Delete relationships first
      const { error: relDeleteError } = await supabase
        .from('director_actor')
        .delete()
        .eq('actor_id', actorId);
      
      if (relDeleteError) {
        throw new ApiError(500, `Failed to delete relationships: ${relDeleteError.message}`);
      }
      
      // Delete the actor
      const { error: actorDeleteError } = await supabase
        .from('actors')
        .delete()
        .eq('id', actorId);
      
      if (actorDeleteError) {
        throw new ApiError(500, `Failed to delete child profile: ${actorDeleteError.message}`);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Child profile deletion failed: ${(error as Error).message}`);
    }
  }
}
