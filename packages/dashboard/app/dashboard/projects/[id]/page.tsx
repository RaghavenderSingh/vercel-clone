"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectsAPI, deploymentsAPI } from "@/lib/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  ExternalLink, 
  Github, 
  Settings, 
  GitBranch, 
  ChevronRight,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Box,
  Terminal,
  Activity,
  MoreHorizontal,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { FixSuggestions } from "@/components/auto-fixer/FixSuggestions";
import { EnvVarsSettings } from "@/components/projects/settings/EnvVarsSettings";
import { DomainSettings } from "@/components/projects/settings/DomainSettings";
import { BuildSettings } from "@/components/projects/settings/BuildSettings";
import { DangerZone } from "@/components/projects/settings/DangerZone";
import { DeploymentLogs } from "@/components/projects/DeploymentLogs";
import { DashboardPage } from "@/components/dashboard-page";
import { PremiumCard, PremiumCardContent } from "@/components/ui/premium-card";
import { cn } from "@/lib/utils";

interface Deployment {
  id: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  status: string;
  deploymentUrl: string;
  createdAt: string;
  buildLogs?: string;
}

interface Project {
  id: string;
  name: string;
  repoUrl: string;
  framework: string;
  buildConfig: {
    buildCommand: string;
    installCommand: string;
    envVars: Record<string, string>;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "deployments" | "settings">("overview");
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchDeployments();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      if (!id) return;
      const { data } = await projectsAPI.get(id);
      setProject(data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async () => {
    try {
      if (!id) return;
      const { data } = await deploymentsAPI.listByProject(id);
      setDeployments(data);
    } catch (error) {
      console.error("Failed to fetch deployments:", error);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    try {
      if (!id) return;
      await deploymentsAPI.create({
        projectId: id,
        type: 'manual',
        branch: 'main',
        commitSha: `manual-${Date.now()}`,
        commitMessage: "Manual deployment",
      });
      await fetchDeployments();
    } catch (error: any) {
      console.error("Failed to deploy:", error);
      setError(error.message || "Failed to deploy.");
    } finally {
      setDeploying(false);
    }
  };

  const handleRedeploy = async (deployment: Deployment) => {
    setDeploying(true);
    try {
      const isManual = deployment.commitSha.startsWith('manual-');
      await deploymentsAPI.create({
        projectId: id,
        type: isManual ? 'manual' : 'git',
        branch: deployment.branch,
        commitSha: deployment.commitSha,
        commitMessage: deployment.commitMessage,
      });
      await fetchDeployments();
    } catch (error) {
      console.error("Failed to redeploy:", error);
    } finally {
      setDeploying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "building": return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
      case "queued": return <Clock className="h-4 w-4 text-blue-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "building": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "queued": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "error": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted/50 text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-white">Project not found</h1>
          <Link href="/dashboard">
            <Button className="bg-white text-black font-black px-6 rounded-xl hover:bg-zinc-200">
               Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestDeployment = deployments[0];

  return (
    <DashboardPage
      title={project.name}
      description={project.repoUrl.replace('https://github.com/', '')}
      breadcrumbs={[{ label: "Projects", href: "/dashboard" }, { label: project.name }]}
      headerActions={
        <div className="flex items-center gap-3">
          <a href={latestDeployment?.deploymentUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="h-11 px-6 rounded-2xl border-white/10 bg-white/5 font-black text-xs uppercase tracking-widest hover:bg-white/10 text-white gap-2">
              Visit <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
          <Button 
            onClick={handleDeploy}
            disabled={deploying}
            className="h-11 px-6 bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-white/90 rounded-2xl gap-3 shadow-2xl shadow-white/5"
          >
            {deploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            {deploying ? "Deploying..." : "Redeploy"}
          </Button>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.05]">
          {["overview", "deployments", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "relative px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all duration-300",
                activeTab === tab ? "text-white" : "text-muted-foreground hover:text-white"
              )}
            >
              <span className="relative z-10">{tab}</span>
              {activeTab === tab && (
                <motion.div 
                    layoutId="activeTabProject"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-10 lg:grid-cols-3"
            >
               <div className="lg:col-span-2 space-y-10">
                  <PremiumCard variant="glass" className="overflow-hidden">
                     <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-white/[0.05]">
                        <div className="p-8 flex-1 space-y-8">
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Production</span>
                              </div>
                           </div>
                           
                           <div>
                              <h3 className="text-2xl font-black tracking-tighter text-white mb-2">Production Deployment</h3>
                              <p className="text-sm font-medium text-muted-foreground">The latest deployment is live and accessible at this URL.</p>
                           </div>

                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">URL</p>
                                 <Link href={latestDeployment?.deploymentUrl || "#"} target="_blank" className="flex items-center gap-2 text-sm font-bold text-white hover:text-primary transition-colors truncate">
                                    {latestDeployment?.deploymentUrl.replace('https://', '') || "Not deployed"}
                                 </Link>
                              </div>
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Status</p>
                                 <div className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", latestDeployment?.status === 'ready' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground")} />
                                    <span className="text-sm font-bold text-white capitalize">{latestDeployment?.status || "Inactive"}</span>
                                 </div>
                              </div>
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Branch</p>
                                 <div className="flex items-center gap-2 text-sm font-bold text-white">
                                    <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                                    {latestDeployment?.branch || "main"}
                                 </div>
                              </div>
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Commit</p>
                                 <div className="flex items-center gap-2 text-sm font-bold text-white truncate">
                                    <Github className="h-3.5 w-3.5 text-muted-foreground" />
                                    {latestDeployment?.commitSha.slice(0, 7) || "N/A"}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="w-full xl:w-96 aspect-square bg-white/[0.02] flex items-center justify-center p-8 group relative overflow-hidden">
                           <div className="w-full h-full relative rounded-2xl border border-white/[0.05] overflow-hidden bg-background shadow-2xl">
                             {latestDeployment?.status === 'ready' ? (
                               <iframe
                                   src={latestDeployment.deploymentUrl}
                                   className="w-full h-full border-0 pointer-events-none"
                                   title="Preview"
                               />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                  <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Generating Preview</span>
                               </div>
                             )}
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <a href={latestDeployment?.deploymentUrl} target="_blank" rel="noopener noreferrer">
                                   <Button className="bg-white text-black font-black px-6 py-2 rounded-xl text-xs uppercase tracking-widest shadow-2xl">Visit Deployment</Button>
                                </a>
                             </div>
                           </div>
                        </div>
                     </div>
                  </PremiumCard>

                  <section className="space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] px-1 flex items-center gap-3">
                      <Terminal className="h-4 w-4 text-muted-foreground" />
                      Build Logs
                    </h3>
                    <DeploymentLogs 
                        deploymentId={latestDeployment?.id} 
                        initialLogs={latestDeployment?.buildLogs}
                        status={latestDeployment?.status}
                    />
                  </section>
               </div>

               <aside className="space-y-10">
                  <section className="space-y-6">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Recent Activity</h3>
                    <div className="space-y-0 relative pl-4">
                        <div className="absolute left-[19px] top-2 bottom-8 w-px bg-white/[0.05]" />
                        {deployments.slice(0, 4).map((dep, idx) => (
                           <div key={dep.id} className="relative flex gap-6 pb-1 group last:pb-0">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full border-[2.5px] border-background relative z-10 translate-y-1.5 shrink-0",
                                dep.status === 'ready' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground"
                              )} />
                              <div className="flex-1 space-y-1 transition-all group-hover:translate-x-1">
                                 <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{dep.commitMessage}</p>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatDistanceToNow(new Date(dep.createdAt))} ago</span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">{dep.branch}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveTab("deployments")}
                      className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white flex items-center justify-between px-4 group"
                    >
                       View All Deployments
                       <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </section>

                  {/* AI Fix Suggestions */}
                  {deployments.some(d => d.status === 'error') && (
                      <section className="space-y-6">
                        <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.2em] px-1 flex items-center gap-3">
                          <Zap className="h-4 w-4 fill-current" />
                          AI Diagnostics
                        </h3>
                        <FixSuggestions deploymentId={deployments.find(d => d.status === 'error')?.id || ''} />
                      </section>
                  )}
               </aside>
            </motion.div>
          )}

          {activeTab === "deployments" && (
            <motion.div 
                key="deployments"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
            >
                <PremiumCard>
                    <div className="divide-y divide-white/[0.05]">
                        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            <div className="col-span-1 text-center">Status</div>
                            <div className="col-span-5">Deployment Source</div>
                            <div className="col-span-2">Branch</div>
                            <div className="col-span-3">Time Ended</div>
                            <div className="col-span-1"></div>
                        </div>
                        {deployments.map((dep) => (
                            <div key={dep.id} className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.01] transition-colors group">
                                <div className="col-span-1 flex justify-center">
                                    <div className={cn("w-2 h-2 rounded-full", dep.status === 'ready' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground")} />
                                </div>
                                <div className="col-span-5 space-y-1">
                                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors cursor-pointer truncate">{dep.commitMessage}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{dep.commitSha.slice(0, 7)}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.05] text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {dep.branch}
                                    </span>
                                </div>
                                <div className="col-span-3">
                                    <p className="text-xs font-bold text-white">{formatDistanceToNow(new Date(dep.createdAt))} ago</p>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white transition-opacity opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="glass-panel text-white rounded-xl min-w-[160px] p-2 mt-2">
                                            <DropdownMenuItem className="focus:bg-white/[0.05] font-bold text-[10px] px-3 py-2 uppercase tracking-widest rounded-lg">View Logs</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRedeploy(dep)} className="focus:bg-white/[0.05] font-bold text-[10px] px-3 py-2 uppercase tracking-widest rounded-lg">Redeploy</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </PremiumCard>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-16"
            >
                <div className="grid gap-16">
                  <DomainSettings projectId={project.id} />
                  
                  <EnvVarsSettings 
                    projectId={project.id} 
                    initialEnvVars={project.buildConfig.envVars || {}} 
                    onUpdate={fetchProject}
                  />

                  <BuildSettings 
                    projectId={project.id}
                    initialConfig={{
                        buildCommand: project.buildConfig.buildCommand,
                        installCommand: project.buildConfig.installCommand
                    }}
                  />

                  <DangerZone projectId={project.id} />
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardPage>
  );
}
