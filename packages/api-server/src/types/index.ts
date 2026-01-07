export interface createProjectDto {
    name: string;
    repoUrl: string;
    framework: string;
    buildCommand?: string;
    installCommand?: string;
    envVars?: Record<string, string>;
    defaultBranch?: string;
  }
  
  export interface GitHubWebhookPayload {
    ref: string;
    repository: {
      clone_url: string;
      full_name: string;
    };
    head_commit: {
      id: string;
      message: string;
    };
    pusher: {
      email: string;
    };
  }
  
  export interface BuildJob {
    deploymentId: string;
    projectId?: string;
    repoUrl: string;
    commitSha?: string;
    branch: string;
    buildCommand: string;
    installCommand: string;
    envVars?: Record<string, string>;
    sourceType?: 'git' | 'zip';
    zipPath?: string;
  }
  
  export enum DeploymentStatus {
    QUEUED = "queued",
    BUILDING = "building",
    READY = "ready",
    ERROR = "error",
  }
