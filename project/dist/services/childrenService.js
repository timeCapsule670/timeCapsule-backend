"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChild = exports.updateChild = exports.getChildById = exports.getChildrenByUserId = exports.createChild = void 0;
const supabase_1 = __importDefault(require("../config/supabase"));
const errorHandler_1 = require("../middleware/errorHandler");
const createChild = async (userId, childData) => {
    try {
        const { data, error } = await supabase_1.default
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
            throw new errorHandler_1.ApiError(400, `Failed to create child profile: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Child creation failed: ${error.message}`);
    }
};
exports.createChild = createChild;
const getChildrenByUserId = async (userId) => {
    try {
        const { data, error } = await supabase_1.default
            .from('children')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new errorHandler_1.ApiError(400, `Failed to get children: ${error.message}`);
        }
        return data || [];
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to retrieve children: ${error.message}`);
    }
};
exports.getChildrenByUserId = getChildrenByUserId;
const getChildById = async (childId, userId) => {
    try {
        const { data, error } = await supabase_1.default
            .from('children')
            .select('*')
            .eq('id', childId)
            .eq('user_id', userId)
            .single();
        if (error) {
            throw new errorHandler_1.ApiError(404, `Child not found: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Failed to retrieve child: ${error.message}`);
    }
};
exports.getChildById = getChildById;
const updateChild = async (childId, userId, updateData) => {
    try {
        // First check if the child exists and belongs to the user
        await (0, exports.getChildById)(childId, userId);
        const { data, error } = await supabase_1.default
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
            throw new errorHandler_1.ApiError(400, `Failed to update child: ${error.message}`);
        }
        return data;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Child update failed: ${error.message}`);
    }
};
exports.updateChild = updateChild;
const deleteChild = async (childId, userId) => {
    try {
        // First check if the child exists and belongs to the user
        await (0, exports.getChildById)(childId, userId);
        const { error } = await supabase_1.default
            .from('children')
            .delete()
            .eq('id', childId)
            .eq('user_id', userId);
        if (error) {
            throw new errorHandler_1.ApiError(400, `Failed to delete child: ${error.message}`);
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError) {
            throw error;
        }
        throw new errorHandler_1.ApiError(500, `Child deletion failed: ${error.message}`);
    }
};
exports.deleteChild = deleteChild;
