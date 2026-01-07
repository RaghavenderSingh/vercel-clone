import { Request, Response } from 'express';
import { prisma } from '@titan/db';

/**
 * AI Controller
 * Handles AI-related endpoints (fix suggestions, code analysis, chat)
 */

/**
 * GET /api/ai/fix-suggestions/:deploymentId
 * Get all fix suggestions for a deployment
 */
export async function getFixSuggestions(req: Request, res: Response) {
  try {
    const { deploymentId } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { project: true },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const suggestions = await prisma.aIFixSuggestion.findMany({
      where: { deploymentId },
      orderBy: { confidence: 'desc' },
    });

    res.json({
      deploymentId,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error('Failed to get fix suggestions:', error);
    res.status(500).json({ error: 'Failed to get fix suggestions' });
  }
}

/**
 * PATCH /api/ai/fix-suggestions/:id/dismiss
 * Dismiss a fix suggestion
 */
export async function dismissFixSuggestion(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const suggestion = await prisma.aIFixSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Fix suggestion not found' });
    }

    const updated = await prisma.aIFixSuggestion.update({
      where: { id },
      data: { status: 'dismissed' },
    });

    res.json({
      message: 'Fix suggestion dismissed',
      suggestion: updated,
    });
  } catch (error) {
    console.error('Failed to dismiss fix suggestion:', error);
    res.status(500).json({ error: 'Failed to dismiss fix suggestion' });
  }
}

/**
 * PATCH /api/ai/fix-suggestions/:id/apply
 * Mark a fix suggestion as applied
 */
export async function applyFixSuggestion(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const suggestion = await prisma.aIFixSuggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return res.status(404).json({ error: 'Fix suggestion not found' });
    }

    const updated = await prisma.aIFixSuggestion.update({
      where: { id },
      data: { status: 'applied' },
    });

    res.json({
      message: 'Fix suggestion marked as applied',
      suggestion: updated,
    });
  } catch (error) {
    console.error('Failed to apply fix suggestion:', error);
    res.status(500).json({ error: 'Failed to apply fix suggestion' });
  }
}

/**
 * GET /api/ai/deployment/:deploymentId/status
 * Get AI analysis status for a deployment
 */
export async function getAIStatus(req: Request, res: Response) {
  try {
    const { deploymentId } = req.params;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        fixSuggestions: {
          orderBy: { confidence: 'desc' },
        },
        codeAnalysis: {
          include: {
            recommendations: {
              orderBy: { severity: 'desc' },
            },
          },
        },
      },
    });

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json({
      deploymentId,
      hasFixSuggestions: deployment.fixSuggestions.length > 0,
      hasCodeAnalysis: !!deployment.codeAnalysis,
      fixSuggestionsCount: deployment.fixSuggestions.length,
      codeAnalysis: deployment.codeAnalysis,
    });
  } catch (error) {
    console.error('Failed to get AI status:', error);
    res.status(500).json({ error: 'Failed to get AI status' });
  }
}
