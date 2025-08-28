export interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateChildRequest {
  name: string;
  birth_date: string;
  gender?: string;
}

export interface UpdateChildRequest {
  name?: string;
  birth_date?: string;
  gender?: string;
}

// New types for enhanced child profile system
export interface Actor {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  notes?: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export interface Director {
  id: string;
  auth_user_id: string;
  director_type: string;
  created_at: string;
  updated_at: string;
}

export interface DirectorActorRelationship {
  id: string;
  director_id: string;
  actor_id: string;
  relationship: string;
  created_at: string;
}

export interface CreateActorRequest {
  first_name: string;
  last_name?: string;
  date_of_birth: string;
  gender?: string;
  notes?: string;
}

// Frontend-compatible interface
export interface FrontendChildRequest {
  id: string;
  name: string;
  birthday: string;
  birthdayDate?: Date;
  username?: string;
}

export interface CreateChildProfileRequest {
  children: FrontendChildRequest[];
}

export interface ChildProfileResponse {
  actors: Actor[];
  relationships: DirectorActorRelationship[];
  message: string;
  nextStep: string;
  actorIds: string[]; // Frontend needs these for next step
}

export interface UsernameGenerationResult {
  username: string;
  isUnique: boolean;
}