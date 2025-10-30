import supabase from '../config/supabase';
import { Avatar, SaveProfilePictureRequest } from '../types/profilePicture';

// Predefined avatars as specified in the requirements

export const getAllAvatars = async (): Promise<Avatar[]> => {
  try {
    // Fetch avatars from Supabase Storage bucket
    const { data: files, error } = await supabase.storage
      .from('profile-pictures')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      throw new Error(`Failed to fetch avatars from storage: ${error.message}`);
    }

    if (!files || files.length === 0) {
      // Return empty array if no files found
      return [];
    }

            // Convert storage files to Avatar objects
        const avatars: Avatar[] = files
          .filter(file => file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          .map((file, index) => {
            const { data: urlData } = supabase.storage
              .from('profile-pictures')
              .getPublicUrl(file.name);
        
        return {
          id: `avatar-${index + 1}`,
          imageUrl: urlData.publicUrl,
          label: file.name.replace(/\.[^/.]+$/, '') // Remove file extension for label
        };
      });

    return avatars;
  } catch (error) {
    throw new Error(`Failed to fetch avatars: ${error}`);
  }
};

export const saveProfilePicture = async (
  directorId: string,
  request: SaveProfilePictureRequest
): Promise<{ profile_picture_url: string }> => {
  try {
    const { type, data, firstName, lastName, dateOfBirth } = request;
    
    if (!type || !data) {
      throw new Error('Profile picture type and data are required');
    }

    let profilePictureUrl: string;

    if (type === 'avatar') {
      // For avatar selection, the data should be the avatar ID
      // We need to fetch the current avatars to get the URL
      const avatars = await getAllAvatars();
      const selectedAvatar = avatars.find(avatar => avatar.id === data);
      
      if (!selectedAvatar) {
        throw new Error(`Invalid avatar ID: ${data}`);
      }
      
      profilePictureUrl = selectedAvatar.imageUrl;
    } else if (type === 'upload') {
      // For uploads, the data should be the image URL
      profilePictureUrl = data;
    } else {
      throw new Error('Invalid profile picture type. Must be "upload" or "avatar"');
    }

    // Prepare update object with profile picture and optional fields
    const updateData: any = {
      profile_picture_url: profilePictureUrl,
      updated_at: new Date().toISOString()
    };

    // Add firstName if provided
    if (firstName !== undefined && firstName !== null) {
      updateData.first_name = firstName.trim();
    }

    // Add lastName if provided
    if (lastName !== undefined && lastName !== null) {
      updateData.last_name = lastName.trim();
    }

    // Add dateOfBirth if provided (convert to ISO date format)
    if (dateOfBirth !== undefined && dateOfBirth !== null) {
      const date = new Date(dateOfBirth);
      if (!isNaN(date.getTime())) {
        updateData.date_of_birth = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    }

    // Update the director's profile picture URL and other fields in the database
    const { error: updateError } = await supabase
      .from('directors')
      .update(updateData)
      .eq('id', directorId);

    if (updateError) {
      throw new Error(`Failed to update profile picture: ${updateError.message}`);
    }

    return {
      profile_picture_url: profilePictureUrl
    };
  } catch (error) {
    throw new Error(`Failed to save profile picture: ${error}`);
  }
};

export const uploadProfilePicture = async (
  file: Express.Multer.File
): Promise<{ image_url: string; file_path: string }> => {
  try {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `uploads/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    return {
      image_url: urlData.publicUrl,
      file_path: fileName
    };
  } catch (error) {
    throw new Error(`Failed to upload profile picture: ${error}`);
  }
};
