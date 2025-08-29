export interface FamilySetupRequest {
  selectedRole: string;
  actorIds: string[] | string;
}

export interface FamilySetupResponse {
  success: boolean;
  message: string;
  directorType: string;
  relationshipsCreated: number;
  nextStep: string;
}

export interface DirectorUpdateRequest {
  directorType: string;
}

export interface DirectorActorRelationshipRequest {
  directorId: string;
  actorId: string;
  relationship: string;
}
