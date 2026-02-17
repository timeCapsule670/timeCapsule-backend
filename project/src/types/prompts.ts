export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratePromptRequest {
  conversation: ConversationTurn[];
  categoryIds?: string[];
}

export interface GeneratePromptResponse {
  /** The full generated message content (the letter/message to be opened). */
  content: string;
  title?: string;
}
