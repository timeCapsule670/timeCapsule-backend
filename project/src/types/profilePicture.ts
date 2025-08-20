export interface Avatar {
  id: string;
  imageUrl: string;
  label: string;
}

export interface GetAvatarsResponse {
  success: boolean;
  data: Avatar[];
}

export interface SaveProfilePictureRequest {
  type: 'upload' | 'avatar';
  data: string; // image_url for upload, avatar_id for avatar
}

export interface SaveProfilePictureResponse {
  success: boolean;
  message: string;
  data: {
    profile_picture_url: string;
  };
}

export interface UploadProfilePictureResponse {
  success: boolean;
  data: {
    image_url: string;
    file_path: string;
  };
}
