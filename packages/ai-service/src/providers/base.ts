import type { AIRequest, AIResponse } from '../types';

/**
 * Base interface that all AI providers must implement
 * Supports both Claude (Anthropic) and Gemini (Google)
 */
export interface AIProvider {
  /**
   * Stream completion responses (for real-time chat)
   * @param request - The AI request with prompt and options
   * @returns AsyncGenerator yielding content chunks
   */
  streamCompletion(request: AIRequest): AsyncGenerator<string, void, unknown>;

  /**
   * Get a complete response (non-streaming)
   * @param request - The AI request with prompt and options
   * @returns Promise with complete AI response
   */
  completion(request: AIRequest): Promise<AIResponse>;

  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Get the current model being used
   */
  getModel(): string;
}
