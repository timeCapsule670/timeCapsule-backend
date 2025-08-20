export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface GetCategoriesResponse {
  success: boolean;
  data: Category[];
}

export interface SaveCategoriesRequest {
  category_ids: string[];
}

export interface SaveCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    saved_count: number;
    existing_count: number;
  };
}
