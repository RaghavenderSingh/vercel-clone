export enum DeploymentStatus {
  QUEUED = "queued",
  BUILDING = "building",
  READY = "ready",
  ERROR = "error",
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
  sourceType?: "git" | "zip";
  zipPath?: string;
}
