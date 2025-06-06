export type MessageType = 'text' | 'audio' | 'video' | 'image';

export interface Message {
  id: string;
  user_id: string;
  child_id: string;
  title: string;
  content: string;
  type: MessageType;
  delivery_date: string;
  created_at: string;
  updated_at: string;
  is_delivered: boolean;
  media_url?: string;
  ai_prompt?: string;
}

export interface CreateMessageRequest {
  child_id: string;
  title: string;
  content: string;
  type: MessageType;
  delivery_date: string;
  media_url?: string;
  ai_prompt?: string;
}

export interface UpdateMessageRequest {
  title?: string;
  content?: string;
  type?: MessageType;
  delivery_date?: string;
  media_url?: string;
  ai_prompt?: string;
}