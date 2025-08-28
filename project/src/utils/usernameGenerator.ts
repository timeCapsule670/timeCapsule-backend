import { UsernameGenerationResult } from '../types/children';
import supabase from '../config/supabase';

/**
 * Generates a unique username for a child profile
 * Format: firstname + 6-digit timestamp suffix
 */
export const generateUsername = async (firstName: string): Promise<UsernameGenerationResult> => {
  try {
    // Clean the first name: lowercase, remove special chars, keep only letters and numbers
    const cleanFirstName = firstName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
    
    if (cleanFirstName.length === 0) {
      throw new Error('Invalid first name for username generation');
    }
    
    // Generate timestamp suffix (6 digits)
    const timestamp = Date.now().toString().slice(-6);
    
    // Create username
    const username = `${cleanFirstName}${timestamp}`;
    
    // Check if username is unique
    const isUnique = await checkUsernameUniqueness(username);
    
    return {
      username,
      isUnique
    };
  } catch (error) {
    throw new Error(`Username generation failed: ${(error as Error).message}`);
  }
};

/**
 * Checks if a username is unique in the system
 */
const checkUsernameUniqueness = async (username: string): Promise<boolean> => {
  try {
    // Check in actors table
    const { data: actors, error: actorsError } = await supabase
      .from('actors')
      .select('username')
      .eq('username', username)
      .limit(1);
    
    if (actorsError) {
      throw new Error(`Database error checking actors: ${actorsError.message}`);
    }
    
    // Check in users table (if applicable)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .limit(1);
    
    if (usersError) {
      // If users table doesn't exist, just check actors
      if (usersError.code === '42P01') { // Table doesn't exist
        return actors.length === 0;
      }
      throw new Error(`Database error checking users: ${usersError.message}`);
    }
    
    // Username is unique if it doesn't exist in either table
    return actors.length === 0 && users.length === 0;
  } catch (error) {
    throw new Error(`Username uniqueness check failed: ${(error as Error).message}`);
  }
};

/**
 * Generates a fallback username if the primary one conflicts
 * Uses additional random digits to ensure uniqueness
 */
export const generateFallbackUsername = async (firstName: string): Promise<string> => {
  const cleanFirstName = firstName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
  
  // Try multiple times with different suffixes
  for (let attempt = 1; attempt <= 10; attempt++) {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const username = `${cleanFirstName}${timestamp}${randomSuffix}`;
    
    const isUnique = await checkUsernameUniqueness(username);
    if (isUnique) {
      return username;
    }
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // If all attempts fail, use a more unique approach
  const timestamp = Date.now().toString();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanFirstName}${timestamp}${randomSuffix}`;
};
