import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from './base';
import type { AIRequest, AIResponse, ProviderConfig } from '../types';

/**
 * Claude (Anthropic) AI Provider
 * Uses the official @anthropic-ai/sdk
 */
export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(config: ProviderConfig) {
    if (!config.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for ClaudeProvider');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 60000, // 60 seconds
    });

    // Default to Claude 3.5 Sonnet
    this.model = config.model || 'claude-3-5-sonnet-20241022';
  }

  getName(): string {
    return 'claude';
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Stream completion from Claude with real-time chunks
   */
  async *streamCompletion(request: AIRequest): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  /**
   * Get complete response from Claude (non-streaming)
   */
  async completion(request: AIRequest): Promise<AIResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature || 0.7,
      system: request.systemPrompt,
      messages: [
        {
          role: 'user',
          content: request.prompt,
        },
      ],
    });

    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');

    return {
      content,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
      model: response.model,
      finishReason: response.stop_reason || undefined,
    };
  }
}
