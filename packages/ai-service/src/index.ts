import type { AIProvider } from './providers/base';
import { ClaudeProvider } from './providers/claude';
import { GeminiProvider } from './providers/gemini';
import {
  getErrorFixerSystemPrompt,
  buildErrorFixerPrompt,
} from './prompts/error-fixer';
import {
  getCodeOptimizerSystemPrompt,
  buildCodeOptimizerPrompt,
} from './prompts/code-optimizer';
import {
  getChatAssistantSystemPrompt,
  buildChatAssistantPrompt,
} from './prompts/chat-assistant';
import type {
  AIRequest,
  AIResponse,
  AIProviderType,
  BuildContext,
  FileContent,
  FixSuggestion,
  OptimizationRecommendation,
  ConversationContext,
  ProviderConfig,
} from './types';

/**
 * Main AI Service class that provides a unified interface for AI operations
 * Supports multiple providers (Claude, Gemini) through abstraction
 */
export class AIService {
  private provider: AIProvider;
  private providerType: AIProviderType;

  constructor(providerType: AIProviderType = 'claude', config?: Partial<ProviderConfig>) {
    this.providerType = providerType;

    // Get API key from environment or config
    const apiKey = config?.apiKey || this.getApiKeyFromEnv(providerType);

    const providerConfig: ProviderConfig = {
      apiKey,
      model: config?.model,
      maxRetries: config?.maxRetries || 3,
      timeout: config?.timeout || 60000,
    };

    // Initialize the appropriate provider
    this.provider =
      providerType === 'claude'
        ? new ClaudeProvider(providerConfig)
        : new GeminiProvider(providerConfig);
  }

  /**
   * Get API key from environment variables
   */
  private getApiKeyFromEnv(providerType: AIProviderType): string {
    const key =
      providerType === 'claude'
        ? process.env.ANTHROPIC_API_KEY
        : process.env.GOOGLE_AI_API_KEY;

    if (!key) {
      throw new Error(
        `API key not found. Please set ${
          providerType === 'claude' ? 'ANTHROPIC_API_KEY' : 'GOOGLE_AI_API_KEY'
        } environment variable.`
      );
    }

    return key;
  }

  /**
   * Get the current provider name
   */
  getProviderName(): string {
    return this.provider.getName();
  }

  /**
   * Get the current model name
   */
  getModelName(): string {
    return this.provider.getModel();
  }

  /**
   * Stream completion responses
   */
  async *streamCompletion(request: AIRequest): AsyncGenerator<string, void, unknown> {
    yield* this.provider.streamCompletion(request);
  }

  /**
   * Get complete response (non-streaming)
   */
  async completion(request: AIRequest): Promise<AIResponse> {
    return this.provider.completion(request);
  }

  /**
   * Analyze build error and suggest fixes
   */
  async analyzeBuildError(
    errorMessage: string,
    context: BuildContext
  ): Promise<FixSuggestion[]> {
    const systemPrompt = getErrorFixerSystemPrompt();
    const userPrompt = buildErrorFixerPrompt(errorMessage, context);

    const response = await this.completion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.3, // Lower temperature for more focused, deterministic responses
      maxTokens: 4096,
    });

    try {
      // Try to parse JSON response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]);
        return suggestions as FixSuggestion[];
      }

      // Fallback: Return response as a single suggestion
      return [
        {
          title: 'Build Error Analysis',
          description: response.content,
          affectedFiles: [],
          confidence: 0.6,
          reasoning: 'AI-generated analysis',
        },
      ];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [
        {
          title: 'Build Error Analysis',
          description: response.content,
          affectedFiles: [],
          confidence: 0.5,
          reasoning: 'AI-generated analysis (unparsed)',
        },
      ];
    }
  }

  /**
   * Analyze code and provide optimization recommendations
   */
  async analyzeCode(
    files: FileContent[],
    framework?: string
  ): Promise<OptimizationRecommendation[]> {
    const systemPrompt = getCodeOptimizerSystemPrompt();
    const userPrompt = buildCodeOptimizerPrompt(files, framework);

    const response = await this.completion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.4,
      maxTokens: 8192, // Higher token limit for code analysis
    });

    try {
      // Try to parse JSON response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations as OptimizationRecommendation[];
      }

      // Fallback: Return response as a single recommendation
      return [
        {
          category: 'best-practices',
          severity: 'medium',
          title: 'Code Analysis',
          description: response.content,
          suggestion: 'Review the analysis above',
          affectedFiles: files.map((f) => f.path),
        },
      ];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [];
    }
  }

  /**
   * Chat with context (streaming)
   */
  async *chatWithContext(
    message: string,
    context: ConversationContext
  ): AsyncGenerator<string, void, unknown> {
    const systemPrompt = getChatAssistantSystemPrompt();
    const userPrompt = buildChatAssistantPrompt(message, context);

    yield* this.streamCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  /**
   * Chat with context (non-streaming)
   */
  async chatWithContextComplete(
    message: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    const systemPrompt = getChatAssistantSystemPrompt();
    const userPrompt = buildChatAssistantPrompt(message, context);

    return this.completion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 4096,
    });
  }
}

// Export everything
export * from './types';
export * from './providers/base';
export { ClaudeProvider } from './providers/claude';
export { GeminiProvider } from './providers/gemini';

// Convenience function to create AI service from environment
export function createAIService(
  providerType?: AIProviderType,
  config?: Partial<ProviderConfig>
): AIService {
  const provider =
    providerType || (process.env.AI_PROVIDER as AIProviderType) || 'claude';
  return new AIService(provider, config);
}
