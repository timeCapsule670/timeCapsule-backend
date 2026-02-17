import { getOpenRouterConfig } from '../config/openRouter';
import { ConversationTurn, GeneratePromptResponse } from '../types/prompts';

// Use a smaller free model to avoid 429 rate limits (gemma-3-27b:free is often limited)
const OPENROUTER_MODEL = 'minimax/minimax-m2.5';

function buildSystemPrompt(categoryNames: string[]): string {
  const categoriesText =
    categoryNames.length > 0
      ? `Tailor the message to these moment categories: ${categoryNames.join(', ')}.`
      : 'Write in a heartfelt, supportive tone suitable for a time-capsule message.';

  return `You help write time-capsule messages. Someone is writing a message to be opened in the future by a recipient—who might be a child, relative, friend, sibling, or any loved one. The user has had a conversation with an AI assistant to brainstorm; your job is to write the actual message (the full letter or text the recipient will read), based on that conversation.

${categoriesText}

Write a complete, ready-to-send message: warm, personal, and appropriate in length (a few short paragraphs is fine). Do not write a meta-prompt or instructions—write the message itself.

Output your response in this exact format so it can be parsed:
MESSAGE:
<the full message text—multiple paragraphs are fine>

TITLE: <a short title, few words>

Do not add any other text before MESSAGE: or after TITLE. Only the MESSAGE body and TITLE line.`;
}

function parseAssistantContent(rawContent: string): GeneratePromptResponse {
  const trimmed = rawContent.trim();

  // Try JSON first
  try {
    const parsed = JSON.parse(trimmed) as { content?: string; message?: string; title?: string };
    const body = parsed.content ?? parsed.message;
    if (body && typeof body === 'string') {
      return {
        content: body,
        title: typeof parsed.title === 'string' ? parsed.title : undefined
      };
    }
  } catch {
    // Not JSON, try MESSAGE: / TITLE: format
  }

  const messageMatch = trimmed.match(/MESSAGE:\s*([\s\S]*?)(?=TITLE:\s*)/i);
  const titleMatch = trimmed.match(/TITLE:\s*([\s\S]+?)(?:\n*$)/im);
  const messageContent = messageMatch ? messageMatch[1].trim() : trimmed;
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  return { content: messageContent, title };
}

export async function generatePrompt(
  conversation: ConversationTurn[],
  categoryNames: string[]
): Promise<GeneratePromptResponse> {
  const { apiKey, baseUrl } = getOpenRouterConfig();

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const systemPrompt = buildSystemPrompt(categoryNames);
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...conversation.map(t => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: 'Based on our conversation above, write the full time-capsule message now (the actual letter the recipient will read). Use the format MESSAGE: (then the full message text) then TITLE: (short title).'
    }
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `OpenRouter request failed (${response.status}): ${errText || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (data.error?.message) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('OpenRouter returned no content');
  }

  return parseAssistantContent(content);
}
