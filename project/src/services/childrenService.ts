import supabase from '../config/supabase';
import { Child, CreateChildRequest, UpdateChildRequest } from '../types/children';
import { ApiError } from '../middleware/errorHandler';

export const createChild = async (userId: string, childData: CreateChildRequest): Promise<Child> => {
  try {
    const { data, error } = await supabase
      .from('children')
      .insert({
        user_id: userId,
        name: childData.name,
        birth_date: childData.birth_date,
        gender: childData.gender,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(400, `Failed to create child profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Child creation failed: ${(error as Error).message}`);
  }
};

export const getChildrenByUserId = async (userId: string): Promise<Child[]> => {
  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(400, `Failed to get children: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to retrieve children: ${(error as Error).message}`);
  }
};

export const getChildById = async (childId: string, userId: string): Promise<Child> => {
  try {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new ApiError(404, `Child not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to retrieve child: ${(error as Error).message}`);
  }
};

export const updateChild = async (
  childId: string,
  userId: string,
  updateData: UpdateChildRequest
): Promise<Child> => {
  try {
    // First check if the child exists and belongs to the user
    await getChildById(childId, userId);

    const { data, error } = await supabase
      .from('children')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', childId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new ApiError(400, `Failed to update child: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Child update failed: ${(error as Error).message}`);
  }
};

export const deleteChild = async (childId: string, userId: string): Promise<void> => {
  try {
    // First check if the child exists and belongs to the user
    await getChildById(childId, userId);

    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId)
      .eq('user_id', userId);

    if (error) {
      throw new ApiError(400, `Failed to delete child: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Child deletion failed: ${(error as Error).message}`);
  }
};