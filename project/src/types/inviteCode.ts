export interface InviteCode {
  id: string;
  code: string;
  director_id: string;
  created_by: string;
  expires_at: string;
  is_used: boolean;
  used_by?: string;
  used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateInviteCodeRequest {
  // No body needed - code is generated server-side
}

export interface GenerateInviteCodeResponse {
  success: boolean;
  data: {
    code: string;
    expiresAt: string;
    formattedExpiration: string;
    message: string;
  };
}

export interface ValidateInviteCodeRequest {
  code: string;
}

export interface ValidateInviteCodeResponse {
  success: boolean;
  data: {
    isValid: boolean;
    isExpired: boolean;
    directorName: string;
    message: string;
  };
}

export interface UseInviteCodeRequest {
  code: string;
  userId: string;
}

export interface UseInviteCodeResponse {
  success: boolean;
  data: {
    message: string;
    directorId: string;
    relationshipCreated: boolean;
  };
}
