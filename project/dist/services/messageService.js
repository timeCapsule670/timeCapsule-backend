"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMessagesForDelivery = exports.deleteMessage = exports.updateMessage = exports.getMessageById = exports.getMessagesByChildId = exports.getMessagesByUserId = exports.createMessage = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const errorHandler_1 = require("../middleware/errorHandler");
const childrenService_1 = require("./childrenService");
const createMessage = async (userId, messageData) => {
    try {
        // Verify that the child exists and belongs to the user
        await (0, childrenService_1.getChildById)(messageData.child_id, userId);
        const { data, error } = await supabase_1.default
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
            throw new errorHandler_1.ApiError(400, `Failed to create message: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Message creation failed: ${error.message}`);
    }
};
exports.createMessage = createMessage;
const getMessagesByUserId = async (userId) => {
    try {
        const { data, error } = await supabase_1.default
            .from('messages')
            .select('*')
            .eq('user_id', userId)
            .order('delivery_date', { ascending: true });
        if (error) {
            throw new errorHandler_1.ApiError(400, `Failed to get messages: ${error.message}`);
        }
        return data || [];
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to retrieve messages: ${error.message}`);
    }
};
exports.getMessagesByUserId = getMessagesByUserId;
const getMessagesByChildId = async (childId, userId) => {
    try {
        // Verify that the child exists and belongs to the user
        await (0, childrenService_1.getChildById)(childId, userId);
        const { data, error } = await supabase_1.default
            .from('messages')
            .select('*')
            .eq('child_id', childId)
            .eq('user_id', userId)
            .order('delivery_date', { ascending: true });
        if (error) {
            throw new errorHandler_1.ApiError(400, `Failed to get messages: ${error.message}`);
        }
        return data || [];
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to retrieve messages: ${error.message}`);
    }
};
exports.getMessagesByChildId = getMessagesByChildId;
const getMessageById = async (messageId, userId) => {
    try {
        const { data, error } = await supabase_1.default
            .from('messages')
            .select('*')
            .eq('id', messageId)
            .eq('user_id', userId)
            .single();
        if (error) {
            throw new errorHandler_1.ApiError(404, `Message not found: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to retrieve message: ${error.message}`);
    }
};
exports.getMessageById = getMessageById;
const updateMessage = async (messageId, userId, updateData) => {
    try {
        // First check if the message exists and belongs to the user
        await (0, exports.getMessageById)(messageId, userId);
        const { data, error } = await supabase_1.default
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
            throw new errorHandler_1.ApiError(400, `Failed to update message: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Message update failed: ${error.message}`);
    }
};
exports.updateMessage = updateMessage;
const deleteMessage = async (messageId, userId) => {
    try {
        // First check if the message exists and belongs to the user
        await (0, exports.getMessageById)(messageId, userId);
        const { error } = await supabase_1.default
            .from('messages')
            .delete()
            .eq('id', messageId)
            .eq('user_id', userId);
        if (error) {
            throw new errorHandler_1.ApiError(400, `Failed to delete message: ${error.message}`);
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Message deletion failed: ${error.message}`);
    }
};
exports.deleteMessage = deleteMessage;
// Function to check for messages ready for delivery
const checkMessagesForDelivery = async () => {
    try {
        const now = new Date().toISOString();
        // Get all undelivered messages with delivery date in the past
        const { data, error } = await supabase_1.default
            .from('messages')
            .select('*')
            .eq('is_delivered', false)
            .lte('delivery_date', now);
        if (error) {
            throw new errorHandler_1.ApiError(500, `Failed to check messages for delivery: ${error.message}`);
        }
        if (data && data.length > 0) {
            // Process each message for delivery
            for (const message of data) {
                // TODO: Implement actual delivery mechanism (email, push notification, etc.)
                console.log(`Delivering message: ${message.id} to child: ${message.child_id}`);
                // Mark message as delivered
                const { error: updateError } = await supabase_1.default
                    .from('messages')
                    .update({ is_delivered: true })
                    .eq('id', message.id);
                if (updateError) {
                    console.error(`Failed to mark message ${message.id} as delivered: ${updateError.message}`);
                }
            }
        }
    }
    catch (error) {
        console.error('Error in message delivery service:', error);
    }
};
exports.checkMessagesForDelivery = checkMessagesForDelivery;
