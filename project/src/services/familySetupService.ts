import supabase from '../config/supabase';
import { 
  FamilySetupRequest, 
  FamilySetupResponse, 
  DirectorActorRelationshipRequest 
} from '../types/familySetup';
import { ApiError } from '../middleware/errorHandler';

export class FamilySetupService {
  /**
   * Handles the complete family setup process
   * - Updates director's role/type
   * - Creates director-actor relationships
   */
  static async setupFamily(
    authUserId: string, 
    request: FamilySetupRequest
  ): Promise<FamilySetupResponse> {
    try {
      console.log('🚀 Family Setup - Starting setup process');
      console.log('📝 Family Setup - Selected role:', request.selectedRole);
      console.log('👥 Family Setup - Actor IDs to process:', request.actorIds);

      // Step 1: Get the director record for the current user
      console.log('👤 Family Setup - Fetching director profile...');
      const { data: directorData, error: directorError } = await supabase
        .from('directors')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (directorError) {
        console.error('❌ Family Setup - Director fetch error:', directorError);
        throw new ApiError(404, 'Could not find your profile. Please try again.');
      }

      if (!directorData) {
        console.error('❌ Family Setup - No director data returned');
        throw new ApiError(404, 'Could not find your profile. Please try again.');
      }

      const directorId = directorData.id;
      console.log('✅ Family Setup - Director ID found:', directorId);

      // Step 2: Update the director's role/type
      console.log('📝 Family Setup - Updating director role to:', request.selectedRole);
      const { error: updateError } = await supabase
        .from('directors')
        .update({ director_type: request.selectedRole })
        .eq('id', directorId);

      if (updateError) {
        console.error('❌ Family Setup - Director update error:', updateError);
        throw new ApiError(500, 'Failed to update your profile. Please try again.');
      }

      console.log('✅ Family Setup - Director role updated successfully');

      // Step 3: Parse actor IDs from the request
      let actorIdsList: string[] = [];
      console.log('🔄 Family Setup - Processing actor IDs...');
      
      if (request.actorIds) {
        try {
          // Handle both string and array formats (matching frontend logic)
          if (typeof request.actorIds === 'string') {
            actorIdsList = request.actorIds.split(',').filter(id => id.trim());
            console.log('📋 Family Setup - Parsed actor IDs from string:', actorIdsList);
          } else if (Array.isArray(request.actorIds)) {
            actorIdsList = request.actorIds.filter(id => typeof id === 'string' && id.trim());
            console.log('📋 Family Setup - Parsed actor IDs from array:', actorIdsList);
          } else {
            console.log('⚠️ Family Setup - Unexpected actorIds format:', typeof request.actorIds, request.actorIds);
          }
          
          // Validate UUID format for all actor IDs
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const invalidIds = actorIdsList.filter(id => !uuidRegex.test(id));
          
          if (invalidIds.length > 0) {
            console.error('❌ Family Setup - Invalid UUID format for actor IDs:', invalidIds);
            throw new ApiError(400, `Invalid UUID format for actor IDs: ${invalidIds.join(', ')}. Please provide valid UUIDs.`);
          }
          
        } catch (parseError) {
          console.error('❌ Family Setup - Error parsing actor IDs:', parseError);
          if (parseError instanceof ApiError) {
            throw parseError;
          }
          throw new ApiError(400, 'Invalid actor IDs format provided.');
        }
      } else {
        console.log('⚠️ Family Setup - No actorIds parameter received');
      }

      console.log('📊 Family Setup - Final actor IDs list:', actorIdsList);
      console.log('📊 Family Setup - Actor IDs count:', actorIdsList.length);

      // Step 4: Create director-actor relationships if we have actor IDs
      let relationshipsCreated = 0;
      if (actorIdsList.length > 0) {
        console.log('🔗 Family Setup - Creating director-actor relationships...');
        
        // First check if any relationships already exist
        const { data: existingRelationships, error: checkError } = await supabase
          .from('director_actor')
          .select('actor_id')
          .eq('director_id', directorId)
          .in('actor_id', actorIdsList);

        if (checkError) {
          console.error('❌ Family Setup - Error checking existing relationships:', checkError);
          // Continue anyway, we'll handle duplicates in the insert
        }

        const existingActorIds = existingRelationships?.map(rel => rel.actor_id) || [];
        console.log('📊 Family Setup - Existing relationships:', existingActorIds);

        // Filter out actors that already have relationships
        const newActorIds = actorIdsList.filter(actorId => !existingActorIds.includes(actorId));
        console.log('📊 Family Setup - New relationships to create:', newActorIds);

        if (newActorIds.length > 0) {
          const relationshipsToInsert = newActorIds.map(actorId => ({
            director_id: directorId,
            actor_id: actorId.trim(),
            relationship: request.selectedRole,
          }));

          console.log('📝 Family Setup - Relationships to insert:', relationshipsToInsert);

          const { data: insertedData, error: relationshipError } = await supabase
            .from('director_actor')
            .insert(relationshipsToInsert)
            .select();

          if (relationshipError) {
            console.error('❌ Family Setup - Relationship insertion error:', relationshipError);
            console.error('❌ Family Setup - Failed relationships data:', relationshipsToInsert);
            
            // Even if relationships fail, the director update was successful
            // Return partial success with warning
            return {
              success: true,
              message: 'Your profile was updated, but there was an issue linking to child profiles. You can set this up later.',
              directorType: request.selectedRole,
              relationshipsCreated: 0,
              nextStep: 'upload_profile_picture'
            };
          }

          console.log('✅ Family Setup - Successfully created director-actor relationships');
          console.log('📊 Family Setup - Inserted relationships data:', insertedData);
          relationshipsCreated = newActorIds.length;
        } else {
          console.log('ℹ️ Family Setup - All relationships already exist, skipping insert');
        }
      } else {
        console.log('⚠️ Family Setup - No actor IDs to process, skipping relationship creation');
      }

      console.log('🎉 Family Setup - Process completed successfully');
      return {
        success: true,
        message: 'Family setup completed successfully!',
        directorType: request.selectedRole,
        relationshipsCreated,
        nextStep: 'upload_profile_picture'
      };
      
    } catch (error) {
      console.error('💥 Family Setup - Unexpected error during setup:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Updates only the director's role/type without creating relationships
   */
  static async updateDirectorRole(
    authUserId: string, 
    directorType: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data: directorData, error: directorError } = await supabase
        .from('directors')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (directorError || !directorData) {
        throw new ApiError(404, 'Could not find your profile. Please try again.');
      }

      const { error: updateError } = await supabase
        .from('directors')
        .update({ director_type: directorType })
        .eq('id', directorData.id);

      if (updateError) {
        throw new ApiError(500, 'Failed to update your profile. Please try again.');
      }

      return {
        success: true,
        message: 'Director role updated successfully'
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Creates director-actor relationships for existing director and actors
   */
  static async createDirectorActorRelationships(
    authUserId: string,
    actorIds: string[],
    relationship: string
  ): Promise<{ success: boolean; relationshipsCreated: number; message: string }> {
    try {
      // Get director ID
      const { data: directorData, error: directorError } = await supabase
        .from('directors')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (directorError || !directorData) {
        throw new ApiError(404, 'Could not find your profile. Please try again.');
      }

      const directorId = directorData.id;

      // Check existing relationships
      const { data: existingRelationships } = await supabase
        .from('director_actor')
        .select('actor_id')
        .eq('director_id', directorId)
        .in('actor_id', actorIds);

      const existingActorIds = existingRelationships?.map(rel => rel.actor_id) || [];
      const newActorIds = actorIds.filter(actorId => !existingActorIds.includes(actorId));

      if (newActorIds.length === 0) {
        return {
          success: true,
          relationshipsCreated: 0,
          message: 'All relationships already exist'
        };
      }

      const relationshipsToInsert = newActorIds.map(actorId => ({
        director_id: directorId,
        actor_id: actorId.trim(),
        relationship,
      }));

      const { error: relationshipError } = await supabase
        .from('director_actor')
        .insert(relationshipsToInsert);

      if (relationshipError) {
        throw new ApiError(500, 'Failed to create relationships. Please try again.');
      }

      return {
        success: true,
        relationshipsCreated: newActorIds.length,
        message: 'Relationships created successfully'
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, 'An unexpected error occurred. Please try again.');
    }
  }
}
