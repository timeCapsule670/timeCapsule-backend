import supabase from '../config/supabase';
import { 
  InviteCode, 
  GenerateInviteCodeResponse,
  ValidateInviteCodeResponse,
  UseInviteCodeResponse
} from '../types/inviteCode';
import { ApiError } from '../middleware/errorHandler';

export class InviteCodeService {
  /**
   * Generates a unique invite code for a director
   * Matches frontend logic: {firstName}-{random3DigitNumber}
   */
  static async generateInviteCode(authUserId: string): Promise<GenerateInviteCodeResponse> {
    try {
      // Get director profile and first name
      const { data: director, error: directorError } = await supabase
        .from('directors')
        .select('id, first_name')
        .eq('auth_user_id', authUserId)
        .single();

      if (directorError || !director) {
        throw new ApiError(404, 'Director profile not found. Please complete your profile setup first.');
      }

      // Generate unique code with retry logic
      let code: string;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        attempts++;
        const firstName = director.first_name || 'User';
        // Take first 3 letters of the name (or full name if less than 3 characters)
        const namePrefix = firstName.length >= 3 ? firstName.substring(0, 3) : firstName;
        const randomNumber = Math.floor(Math.random() * 900) + 100; // 100-999
        code = `${namePrefix}-${randomNumber}`;

        // Check if code already exists
        const { data: existingCode, error: checkError } = await supabase
          .from('invite_codes')
          .select('id')
          .eq('code', code)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw new ApiError(500, `Failed to check code uniqueness: ${checkError.message}`);
        }

        // If code doesn't exist, we can use it
        if (!existingCode) {
          break;
        }

        // If we've tried too many times, throw error
        if (attempts >= maxAttempts) {
          throw new ApiError(500, 'Unable to generate unique invite code. Please try again.');
        }
      } while (true);

      // Set expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Format expiration for display (matching frontend format)
      const formattedExpiration = expiresAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Store the invite code in database
      const { data: inviteCode, error: insertError } = await supabase
        .from('invite_codes')
        .insert({
          code,
          director_id: director.id,
          created_by: authUserId,
          expires_at: expiresAt.toISOString(),
          is_used: false
        })
        .select()
        .single();

      if (insertError) {
        throw new ApiError(500, `Failed to save invite code: ${insertError.message}`);
      }

      return {
        success: true,
        data: {
          code,
          expiresAt: expiresAt.toISOString(),
          formattedExpiration,
          message: 'Invite code generated successfully'
        }
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Invite code generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validates an invite code
   */
  static async validateInviteCode(code: string): Promise<ValidateInviteCodeResponse> {
    try {
      // Find the invite code
      const { data: inviteCode, error: fetchError } = await supabase
        .from('invite_codes')
        .select(`
          *,
          directors!inner(
            first_name,
            last_name
          )
        `)
        .eq('code', code)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return {
            success: true,
            data: {
              isValid: false,
              isExpired: false,
              directorName: '',
              message: 'Invalid invite code'
            }
          };
        }
        throw new ApiError(500, `Failed to validate invite code: ${fetchError.message}`);
      }

      // Check if code is already used
      if (inviteCode.is_used) {
        return {
          success: true,
          data: {
            isValid: false,
            isExpired: false,
            directorName: `${inviteCode.directors.first_name} ${inviteCode.directors.last_name}`.trim(),
            message: 'This invite code has already been used'
          }
          };
      }

      // Check if code is expired
      const now = new Date();
      const expiresAt = new Date(inviteCode.expires_at);
      const isExpired = now > expiresAt;

      if (isExpired) {
        return {
          success: true,
          data: {
            isValid: false,
            isExpired: true,
            directorName: `${inviteCode.directors.first_name} ${inviteCode.directors.last_name}`.trim(),
            message: 'This invite code has expired'
          }
        };
      }

      // Code is valid
      return {
        success: true,
        data: {
          isValid: true,
          isExpired: false,
          directorName: `${inviteCode.directors.first_name} ${inviteCode.directors.last_name}`.trim(),
          message: 'Invite code is valid'
        }
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Invite code validation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Uses an invite code to create a relationship
   */
  static async useInviteCode(code: string, userId: string): Promise<UseInviteCodeResponse> {
    try {
      // Validate the code first
      const validation = await this.validateInviteCode(code);
      
      if (!validation.data.isValid) {
        throw new ApiError(400, validation.data.message);
      }

      // Get the invite code details
      const { data: inviteCode, error: fetchError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !inviteCode) {
        throw new ApiError(400, 'Invalid invite code');
      }

      // Mark code as used
      const { error: updateError } = await supabase
        .from('invite_codes')
        .update({
          is_used: true,
          used_by: userId,
          used_at: new Date().toISOString()
        })
        .eq('id', inviteCode.id);

      if (updateError) {
        throw new ApiError(500, `Failed to mark invite code as used: ${updateError.message}`);
      }

      // Create director-actor relationship
      const { error: relationshipError } = await supabase
        .from('director_actor')
        .insert({
          director_id: inviteCode.director_id,
          actor_id: userId,
          relationship: 'Invited'
        });

      if (relationshipError) {
        // If relationship creation fails, revert the invite code usage
        await supabase
          .from('invite_codes')
          .update({
            is_used: false,
            used_by: null,
            used_at: null
          })
          .eq('id', inviteCode.id);

        throw new ApiError(500, `Failed to create relationship: ${relationshipError.message}`);
      }

      return {
        success: true,
        data: {
          message: 'Invite code used successfully',
          directorId: inviteCode.director_id,
          relationshipCreated: true
        }
      };

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to use invite code: ${(error as Error).message}`);
    }
  }

  /**
   * Gets all invite codes for a director
   */
  static async getInviteCodesByDirector(authUserId: string): Promise<InviteCode[]> {
    try {
      // Get director profile
      const { data: director, error: directorError } = await supabase
        .from('directors')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single();

      if (directorError || !director) {
        throw new ApiError(404, 'Director profile not found');
      }

      // Get invite codes
      const { data: inviteCodes, error: fetchError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('director_id', director.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new ApiError(500, `Failed to fetch invite codes: ${fetchError.message}`);
      }

      return inviteCodes || [];

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to retrieve invite codes: ${(error as Error).message}`);
    }
  }

  /**
   * Revokes an unused invite code
   */
  static async revokeInviteCode(codeId: string, authUserId: string): Promise<void> {
    try {
      // Verify ownership
      const { data: inviteCode, error: fetchError } = await supabase
        .from('invite_codes')
        .select(`
          *,
          directors!inner(auth_user_id)
        `)
        .eq('id', codeId)
        .single();

      if (fetchError || !inviteCode) {
        throw new ApiError(404, 'Invite code not found');
      }

      if (inviteCode.directors.auth_user_id !== authUserId) {
        throw new ApiError(403, 'You do not have permission to revoke this invite code');
      }

      if (inviteCode.is_used) {
        throw new ApiError(400, 'Cannot revoke a used invite code');
      }

      // Delete the invite code
      const { error: deleteError } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', codeId);

      if (deleteError) {
        throw new ApiError(500, `Failed to revoke invite code: ${deleteError.message}`);
      }

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to revoke invite code: ${(error as Error).message}`);
    }
  }
}
