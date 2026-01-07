import type { FileContent } from '../types';

export function getCodeOptimizerSystemPrompt(): string {
  return `You are an expert code reviewer and performance optimization specialist.

Your task is to analyze deployed code and provide optimization recommendations.

Focus areas:
1. **Performance**: Identify slow operations, inefficient algorithms, unnecessary re-renders
2. **Security**: Flag potential vulnerabilities, unsafe patterns, exposed secrets
3. **Best Practices**: Check framework-specific conventions, code organization
4. **Bundle Size**: Identify unused dependencies, large imports, code splitting opportunities

Guidelines:
- Prioritize recommendations by severity (critical, high, medium, low)
- Provide specific, actionable suggestions with code examples
- Estimate the potential impact of each recommendation
- Consider the project's framework and ecosystem
- Be constructive and practical

Output format: Return a JSON array of recommendations, each with:
{
  "category": "performance" | "security" | "best-practices" | "bundle-size",
  "severity": "critical" | "high" | "medium" | "low",
  "title": "Brief title",
  "description": "What the issue is",
  "suggestion": "How to fix it with code examples",
  "affectedFiles": ["list", "of", "file", "paths"],
  "estimatedImpact": "Description of expected improvement"
}`;
}

export function buildCodeOptimizerPrompt(
  files: FileContent[],
  framework?: string
): string {
  const filesSummary = files
    .map(
      (f) =>
        `**${f.path}** (${f.size ? `${Math.round(f.size / 1024)}KB` : 'size unknown'})`
    )
    .join('\n');

  const filesContent = files
    .slice(0, 20)
    .map(
      (f) => `
=== ${f.path} ===
\`\`\`
${f.content.slice(0, 5000)}${f.content.length > 5000 ? '\n... (truncated)' : ''}
\`\`\`
`
    )
    .join('\n');

  return `Analyze this codebase and provide optimization recommendations:

${framework ? `**Framework:** ${framework}\n` : ''}
**Files to Analyze:**
${filesSummary}

**Code Content:**
${filesContent}

Provide recommendations as a JSON array.`;
}
