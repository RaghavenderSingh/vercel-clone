import type { BuildContext } from '../types';

export function getErrorFixerSystemPrompt(): string {
  return `You are an expert software engineer specializing in debugging build and deployment errors.

Your task is to analyze build errors and provide actionable fix suggestions.

Guidelines:
- Analyze the error message, stack trace, and build context carefully
- Provide clear, specific fix suggestions with code examples when applicable
- Assign a confidence score (0.0 to 1.0) to your suggestion
- Identify all affected files
- Explain your reasoning concisely
- Focus on practical, tested solutions
- Consider framework-specific best practices

Output format: Return a JSON array of fix suggestions, each with:
{
  "title": "Brief title of the fix",
  "description": "Detailed explanation of what went wrong",
  "fixedCode": "Code snippet with the fix (if applicable)",
  "affectedFiles": ["list", "of", "file", "paths"],
  "confidence": 0.0-1.0,
  "reasoning": "Why this fix should work"
}`;
}

export function buildErrorFixerPrompt(
  errorMessage: string,
  context: BuildContext
): string {
  return `Analyze this build error and suggest fixes:

**Error Message:**
\`\`\`
${errorMessage}
\`\`\`

**Build Context:**
- Deployment ID: ${context.deploymentId}
- Project ID: ${context.projectId}
${context.repoUrl ? `- Repository: ${context.repoUrl}` : ''}
${context.branch ? `- Branch: ${context.branch}` : ''}
${context.buildCommand ? `- Build Command: ${context.buildCommand}` : ''}
${context.framework ? `- Framework: ${context.framework}` : ''}

Provide fix suggestions as a JSON array.`;
}
