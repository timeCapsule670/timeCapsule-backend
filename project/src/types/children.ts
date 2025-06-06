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