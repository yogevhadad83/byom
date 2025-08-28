export interface Message {
  author: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  // Optional flag for messages visible locally until explicitly shared
  ephemeral?: boolean;
}

// BYOM provider types
export type ProviderName = 'openai' | 'http';

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  endpoint?: string;
  systemPrompt?: string;
}

export interface ProviderResponse {
  ok: boolean;
  provider?: { provider: ProviderName; config: ProviderConfig };
  error?: string;
}
