import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIProvider } from './base';
import type { AIRequest, AIResponse, ProviderConfig } from '../types';

/**
 * Gemini (Google) AI Provider
 * Uses the official @google/generative-ai SDK
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('GOOGLE_AI_API_KEY is required for GeminiProvider');
    }

    this.client = new GoogleGenerativeAI(config.apiKey);

    // Default to Gemini 2.5 Flash (stable, fast, higher free tier limits)
    this.model = config.model || 'gemini-2.5-flash';
  }

  getName(): string {
    return 'gemini';
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Stream completion from Gemini with real-time chunks
   */
  async *streamCompletion(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
      },
    });

    // Combine system prompt and user prompt for Gemini
    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\nUser: ${request.prompt}`
      : request.prompt;

    const result = await model.generateContentStream(fullPrompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }

  /**
   * Get complete response from Gemini (non-streaming)
   */
  async completion(request: AIRequest): Promise<AIResponse> {
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: request.maxTokens || 4096,
        temperature: request.temperature || 0.7,
      },
    });

    // Combine system prompt and user prompt for Gemini
    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\nUser: ${request.prompt}`
      : request.prompt;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const content = response.text();

    // Extract token counts if available
    const usageMetadata = (response as any).usageMetadata;
    const tokens = usageMetadata
      ? {
          input: usageMetadata.promptTokenCount || 0,
          output: usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      content,
      tokens,
      model: this.model,
      finishReason: response.candidates?.[0]?.finishReason,
    };
  }
}
