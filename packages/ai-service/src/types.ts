export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  tokens?: {
    input: number;
    output: number;
  };
  model: string;
  finishReason?: string;
}

export interface BuildContext {
  deploymentId: string;
  projectId: string;
  repoUrl?: string;
  branch?: string;
  buildCommand?: string;
  framework?: string;
}

export interface FileContent {
  path: string;
  content: string;
  size?: number;
}

export interface FixSuggestion {
  title: string;
  description: string;
  fixedCode?: string;
  affectedFiles: string[];
  confidence: number;
  reasoning: string;
}

export interface OptimizationRecommendation {
  category: 'performance' | 'security' | 'best-practices' | 'bundle-size';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  suggestion: string;
  affectedFiles: string[];
  estimatedImpact?: string;
}

export interface ConversationContext {
  projectId: string;
  deploymentHistory?: Array<{
    id: string;
    status: string;
    createdAt: Date;
    logs?: string;
  }>;
  projectMetadata?: {
    name: string;
    framework?: string;
    language?: string;
  };
  recentErrors?: string[];
}

export type AIProviderType = 'claude' | 'gemini';

export interface ProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}
