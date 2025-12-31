import type { ConversationContext } from '../types';

export function getChatAssistantSystemPrompt(): string {
  return `You are an AI assistant for a Vercel-like deployment platform.

Your role is to help users understand their deployments, debug issues, and take actions via natural language.

Capabilities:
- Answer questions about deployment status, logs, and metrics
- Explain errors and suggest fixes
- Provide insights about project performance and usage
- Help with debugging deployment issues
- Recommend optimizations and best practices
- Execute actions when requested (deploy, rollback, etc.)

Guidelines:
- Be concise and technical, but friendly
- Provide specific, actionable information
- Reference deployment IDs, timestamps, and metrics when relevant
- If you don't have enough context, ask clarifying questions
- For complex issues, break down your analysis step-by-step
- Always prioritize accuracy over speculation

Communication style:
- Use technical terminology appropriately
- Format code snippets with markdown
- Use bullet points for lists
- Highlight important warnings or errors`;
}

export function buildChatAssistantPrompt(
  userMessage: string,
  context: ConversationContext
): string {
  const projectInfo = context.projectMetadata
    ? `
**Project:** ${context.projectMetadata.name}
${context.projectMetadata.framework ? `**Framework:** ${context.projectMetadata.framework}` : ''}
${context.projectMetadata.language ? `**Language:** ${context.projectMetadata.language}` : ''}
`
    : '';

  const deploymentHistory =
    context.deploymentHistory && context.deploymentHistory.length > 0
      ? `
**Recent Deployments:**
${context.deploymentHistory
  .slice(0, 5)
  .map(
    (d) =>
      `- ${d.id}: ${d.status} (${new Date(d.createdAt).toLocaleString()})${
        d.logs ? '\n  Logs: ' + d.logs.slice(0, 200) : ''
      }`
  )
  .join('\n')}
`
      : '';

  const recentErrors =
    context.recentErrors && context.recentErrors.length > 0
      ? `
**Recent Errors:**
${context.recentErrors.map((e) => `- ${e}`).join('\n')}
`
      : '';

  return `**User Question:**
${userMessage}

**Context:**
${projectInfo}${deploymentHistory}${recentErrors}

Provide a helpful response based on the available context.`;
}
