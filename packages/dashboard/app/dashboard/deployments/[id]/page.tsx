"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deploymentsAPI } from "@/lib/api";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useDeploymentUpdates, useDeploymentLogs, useSocket } from "@/lib/useSocket";
import { Button } from "@/components/ui/button";
import { ExternalLink, GitBranch, GitCommit, ChevronLeft, Loader2 } from "lucide-react";
import { DeploymentStatusBadge } from "@/components/deployments/DeploymentStatusBadge";
import { DeploymentTerminal } from "@/components/deployments/DeploymentTerminal";
import { motion } from "framer-motion";

interface Deployment {
  id: string;
  projectId: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  status: string;
  buildLogs: string | null;
  deploymentUrl: string;
  createdAt: string;
  updatedAt: string;
  project: {
    name: string;
  };
}

export default function DeploymentLogsPage() {
  const params = useParams();
  const router = useRouter();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const { connected } = useSocket();
  const [liveLogs, setLiveLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchDeployment();
  }, [params.id]);

  // Real-time Updates
  useDeploymentUpdates(params.id as string, (data) => {
    if (data.deploymentId === params.id) {
      setDeployment((prev) => (prev ? { ...prev, status: data.status } : prev));
      if (data.status === 'ready' && !deployment?.deploymentUrl) {
          fetchDeployment(); // Refresh to get URL if it was missing 
      }
    }
  });

  useDeploymentLogs(params.id as string, (log) => {
    setLiveLogs((prev) => [...prev, log]);
  });

  const fetchDeployment = async () => {
    try {
      const { data } = await deploymentsAPI.get(params.id as string);
      setDeployment(data);
    } catch (error) {
      console.error("Failed to fetch deployment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  if (!deployment) return <div className="h-screen flex items-center justify-center">Deployment not found</div>;

  // Combine historical and live logs
  const allLogs = [
      ...(deployment.buildLogs ? deployment.buildLogs.split('\n') : []),
      ...liveLogs
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/projects/${deployment.projectId}`)}>
                  <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                  <h1 className="font-bold text-lg leading-none">{deployment.project.name}</h1>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <GitBranch className="h-3 w-3" />
                      <span>{deployment.branch}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <GitCommit className="h-3 w-3" />
                      <span className="font-mono">{deployment.commitSha.slice(0, 7)}</span>
                  </div>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
                <div className={`hidden md:flex text-xs font-bold uppercase tracking-wider items-center gap-2 ${connected ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`} />
                    {connected ? 'Live Connection' : 'Offline'}
                </div>
                <DeploymentStatusBadge status={deployment.status} />
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden md:flex h-8 rounded-full font-medium border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                >
                    Redeploy
                </Button>
                {deployment.status === 'ready' && (
                    <Button asChild className="h-8 rounded-full font-bold px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all bg-emerald-500 hover:bg-emerald-400 text-black border-0">
                        <a href={deployment.deploymentUrl} target="_blank" rel="noopener noreferrer">
                            Visit <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                    </Button>
                )}
           </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
         {/* Left Column: Logs */}
         <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Build Logs</h2>
            <DeploymentTerminal logs={allLogs} status={deployment.status} />
         </div>

         {/* Right Column: Preview & Details */}
         <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="aspect-video bg-muted relative group">
                     {deployment.status === 'ready' ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                            {/* In a real app, this would be a screenshot */}
                            <div className="text-center space-y-2">
                                <div className="text-6xl">✨</div>
                                <p className="font-bold text-muted-foreground">Deployment Ready</p>
                            </div>
                            {/* Overlay Button */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                <Button asChild variant="secondary" className="font-bold">
                                    <a href={deployment.deploymentUrl} target="_blank">Open Preview</a>
                                </Button>
                            </div>
                         </div>
                     ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                             <div className="text-center space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                <p className="font-medium text-muted-foreground text-sm">Generating preview...</p>
                            </div>
                        </div>
                     )}
                </div>
                <div className="p-4 border-t border-border">
                    <h3 className="font-bold mb-1">Preview</h3>
                    <p className="text-xs text-muted-foreground truncate">{deployment.deploymentUrl || "Pending..."}</p>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Deployment Details</h3>
                
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium capitalize">{deployment.status}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground">Commit</span>
                        <span className="font-mono">{deployment.commitSha.slice(0, 7)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border/40">
                        <span className="text-muted-foreground">Branch</span>
                        <span className="font-medium">{deployment.branch}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{formatDistanceToNow(new Date(deployment.createdAt), { addSuffix: true })}</span>
                    </div>
                </div>
            </div>
         </div>
      </main>
    </div>
  );
}
