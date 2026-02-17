const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const getOpenRouterConfig = () => ({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: OPENROUTER_BASE_URL
});
