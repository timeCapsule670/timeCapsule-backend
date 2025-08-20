"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePicture = exports.saveProfilePicture = exports.getAllAvatars = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
// Predefined avatars as specified in the requirements
const PREDEFINED_AVATARS = [
    { id: 'avatar-1', imageUrl: '/assets/avatars/avatar-1.png', label: 'Avatar 1' },
    { id: 'avatar-2', imageUrl: '/assets/avatars/avatar-2.png', label: 'Avatar 2' },
    { id: 'avatar-3', imageUrl: '/assets/avatars/avatar-3.png', label: 'Avatar 3' },
    { id: 'avatar-4', imageUrl: '/assets/avatars/avatar-4.png', label: 'Avatar 4' },
    { id: 'teenage-girl', imageUrl: '/assets/avatars/teenage-girl.png', label: 'Teenage Girl' },
    { id: 'profile', imageUrl: '/assets/avatars/profile.png', label: 'Profile' }
];
const getAllAvatars = async () => {
    try {
        // Fetch avatars from Supabase Storage bucket
        const { data: files, error } = await supabase_1.default.storage
            .from('avatars')
            .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
        });
        if (error) {
            throw new Error(`Failed to fetch avatars from storage: ${error.message}`);
        }
        if (!files || files.length === 0) {
            // Fallback to predefined avatars if no files found
            return PREDEFINED_AVATARS;
        }
        // Convert storage files to Avatar objects
        const avatars = files
            .filter(file => file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            .map((file, index) => {
            const { data: urlData } = supabase_1.default.storage
                .from('avatars')
                .getPublicUrl(file.name);
            return {
                id: `avatar-${index + 1}`,
                imageUrl: urlData.publicUrl,
                label: file.name.replace(/\.[^/.]+$/, '') // Remove file extension for label
            };
        });
        return avatars;
    }
    catch (error) {
        throw new Error(`Failed to fetch avatars: ${error}`);
    }
};
exports.getAllAvatars = getAllAvatars;
const saveProfilePicture = async (directorId, request) => {
    try {
        const { type, data } = request;
        if (!type || !data) {
            throw new Error('Profile picture type and data are required');
        }
        let profilePictureUrl;
        if (type === 'avatar') {
            // For avatar selection, the data should be the avatar ID
            // We need to fetch the current avatars to get the URL
            const avatars = await (0, exports.getAllAvatars)();
            const selectedAvatar = avatars.find(avatar => avatar.id === data);
            if (!selectedAvatar) {
                throw new Error(`Invalid avatar ID: ${data}`);
            }
            profilePictureUrl = selectedAvatar.imageUrl;
        }
        else if (type === 'upload') {
            // For uploads, the data should be the image URL
            profilePictureUrl = data;
        }
        else {
            throw new Error('Invalid profile picture type. Must be "upload" or "avatar"');
        }
        // Update the director's profile picture URL in the database
        const { error: updateError } = await supabase_1.default
            .from('directors')
            .update({
            profile_picture_url: profilePictureUrl,
            updated_at: new Date().toISOString()
        })
            .eq('id', directorId);
        if (updateError) {
            throw new Error(`Failed to update profile picture: ${updateError.message}`);
        }
        return {
            profile_picture_url: profilePictureUrl
        };
    }
    catch (error) {
        throw new Error(`Failed to save profile picture: ${error}`);
    }
};
exports.saveProfilePicture = saveProfilePicture;
const uploadProfilePicture = async (file) => {
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
        const fileName = `profile-pictures/${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase_1.default.storage
            .from('avatars')
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
        });
        if (uploadError) {
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        // Get public URL
        const { data: urlData } = supabase_1.default.storage
            .from('avatars')
            .getPublicUrl(fileName);
        return {
            image_url: urlData.publicUrl,
            file_path: fileName
        };
    }
    catch (error) {
        throw new Error(`Failed to upload profile picture: ${error}`);
    }
};
exports.uploadProfilePicture = uploadProfilePicture;
