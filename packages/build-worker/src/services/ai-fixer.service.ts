import { prisma } from '@titan/db';
import { createAIService, type BuildContext, type FixSuggestion } from '@vercel-clone/ai-service';
import { createLogger } from '@vercel-clone/shared';
import type { BuildJob } from '../types';

const logger = createLogger('build-worker');

/**
 * AI Fixer Service
 * Analyzes build errors and generates fix suggestions using AI
 */
export class AIFixerService {
  private aiService: ReturnType<typeof createAIService>;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.ENABLE_AI_FIXER === 'true';

    if (this.isEnabled) {
      try {
        this.aiService = createAIService();
        logger.info('AI Fixer enabled', {
          provider: this.aiService.getProviderName(),
          model: this.aiService.getModelName(),
        });
      } catch (error) {
        logger.warn('AI Fixer initialization failed', error instanceof Error ? error : new Error(String(error)));
        this.isEnabled = false;
      }
    } else {
      logger.info('AI Fixer disabled (set ENABLE_AI_FIXER=true to enable)');
    }
  }

  /**
   * Analyze a build error and generate fix suggestions
   */
  async analyzeBuildError(
    deploymentId: string,
    errorMessage: string,
    job: BuildJob
  ): Promise<void> {
    if (!this.isEnabled) {
      logger.debug('AI Fixer disabled, skipping analysis', { deploymentId });
      return;
    }

    try {
      logger.info('Starting AI error analysis', { deploymentId, provider: this.aiService.getProviderName() });

      const startTime = Date.now();

      const context: BuildContext = {
        deploymentId,
        projectId: job.projectId,
        repoUrl: job.repoUrl,
        branch: job.branch,
        buildCommand: job.buildCommand,
        framework: job.framework,
      };

      const suggestions = await this.aiService.analyzeBuildError(errorMessage, context);

      const duration = Date.now() - startTime;

      logger.info('AI analysis complete', {
        deploymentId,
        suggestionsCount: suggestions.length,
        durationMs: duration,
      });

      await this.saveSuggestions(deploymentId, errorMessage, suggestions);

      logger.info('Fix suggestions saved', {
        deploymentId,
        count: suggestions.length,
      });
    } catch (error) {
      logger.error('AI analysis failed', error instanceof Error ? error : new Error(String(error)), {
        deploymentId,
      });
    }
  }

  /**
   * Save fix suggestions to database
   */
  private async saveSuggestions(
    deploymentId: string,
    errorMessage: string,
    suggestions: FixSuggestion[]
  ): Promise<void> {
    const createPromises = suggestions.map((suggestion) =>
      prisma.aIFixSuggestion.create({
        data: {
          deploymentId,
          errorMessage,
          suggestion: suggestion.description,
          fixedCode: suggestion.fixedCode || null,
          confidence: suggestion.confidence,
          status: 'pending',
        },
      })
    );

    await Promise.all(createPromises);
  }

  /**
   * Get fix suggestions for a deployment
   */
  async getFixSuggestions(deploymentId: string) {
    return prisma.aIFixSuggestion.findMany({
      where: { deploymentId },
      orderBy: { confidence: 'desc' },
    });
  }

  /**
   * Check if AI Fixer is enabled
   */
  isAIEnabled(): boolean {
    return this.isEnabled;
  }
}

export const aiFixerService = new AIFixerService();
