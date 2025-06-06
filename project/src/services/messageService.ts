import supabase from '../config/supabase';
import { Message, CreateMessageRequest, UpdateMessageRequest } from '../types/messages';
import { ApiError } from '../middleware/errorHandler';
import { getChildById } from './childrenService';

export const createMessage = async (
  userId: string,
  messageData: CreateMessageRequest
): Promise<Message> => {
  try {
    // Verify that the child exists and belongs to the user
    await getChildById(messageData.child_id, userId);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: userId,
        child_id: messageData.child_id,
        title: messageData.title,
        content: messageData.content,
        type: messageData.type,
        delivery_date: messageData.delivery_date,
        media_url: messageData.media_url,
        ai_prompt: messageData.ai_prompt,
        is_delivered: false,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(400, `Failed to create message: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Message creation failed: ${(error as Error).message}`);
  }
};

export const getMessagesByUserId = async (userId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('delivery_date', { ascending: true });

    if (error) {
      throw new ApiError(400, `Failed to get messages: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to retrieve messages: ${(error as Error).message}`);
  }
};

export const getMessagesByChildId = async (
  childId: string,
  userId: string
): Promise<Message[]> => {
  try {
    // Verify that the child exists and belongs to the user
    await getChildById(childId, userId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('child_id', childId)
      .eq('user_id', userId)
      .order('delivery_date', { ascending: true });

    if (error) {
      throw new ApiError(400, `Failed to get messages: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to retrieve messages: ${(error as Error).message}`);
  }
};

export const getMessageById = async (
  messageId: string,
  userId: string
): Promise<Message> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new ApiError(404, `Message not found: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to retrieve message: ${(error as Error).message}`);
  }
};

export const updateMessage = async (
  messageId: string,
  userId: string,
  updateData: UpdateMessageRequest
): Promise<Message> => {
  try {
    // First check if the message exists and belongs to the user
    await getMessageById(messageId, userId);

    const { data, error } = await supabase
      .from('messages')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new ApiError(400, `Failed to update message: ${error.message}`);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Message update failed: ${(error as Error).message}`);
  }
};

export const deleteMessage = async (messageId: string, userId: string): Promise<void> => {
  try {
    // First check if the message exists and belongs to the user
    await getMessageById(messageId, userId);

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', userId);

    if (error) {
      throw new ApiError(400, `Failed to delete message: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Message deletion failed: ${(error as Error).message}`);
  }
};

// Function to check for messages ready for delivery
export const checkMessagesForDelivery = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    
    // Get all undelivered messages with delivery date in the past
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_delivered', false)
      .lte('delivery_date', now);

    if (error) {
      throw new ApiError(500, `Failed to check messages for delivery: ${error.message}`);
    }

    if (data && data.length > 0) {
      // Process each message for delivery
      for (const message of data) {
        // TODO: Implement actual delivery mechanism (email, push notification, etc.)
        console.log(`Delivering message: ${message.id} to child: ${message.child_id}`);
        
        // Mark message as delivered
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_delivered: true })
          .eq('id', message.id);
          
        if (updateError) {
          console.error(`Failed to mark message ${message.id} as delivered: ${updateError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in message delivery service:', error);
  }
};