"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { projectsAPI, deploymentsAPI } from "@/lib/api";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  ChevronRight,
  Clock,
  CheckCircle2,
  Box,
  GitBranch,
  Loader2,
  Activity as ActivityIcon
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { DashboardPage } from "@/components/dashboard-page";
import { PremiumCard, PremiumCardContent } from "@/components/ui/premium-card";
import { cn } from "@/lib/utils";
import { activityAPI } from "@/lib/api";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

interface Project {
  id: string;
  name: string;
  repoUrl: string;
  framework: string;
  createdAt: string;
}

interface Deployment {
    id: string;
    projectId: string;
    projectName?: string;
    status: string;
    createdAt: string;
    commitMessage: string;
}

export default function DashboardOverviewPage() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentDeployments, setRecentDeployments] = useState<Deployment[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [projectsRes, deploymentsRes, activityRes] = await Promise.all([
        projectsAPI.list(),
        deploymentsAPI.list(),
        activityAPI.list()
      ]);
      setProjects(projectsRes.data);
      setRecentDeployments(deploymentsRes.data.slice(0, 5));
      setRecentActivity(activityRes.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <DashboardPage
        title="Overview"
        description="Manage your projects and monitor deployment activity in real-time."
      >
        <DashboardSkeleton />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage
      title="Overview"
      description="Manage your projects and monitor deployment activity in real-time."
      headerActions={
        <Link href="/dashboard/new">
          <Button className="h-11 px-6 bg-white text-black font-black text-sm hover:bg-white/90 rounded-2xl gap-3 shadow-2xl shadow-white/5">
            <Plus className="h-4 w-4 stroke-[3]" />
            New Project
          </Button>
        </Link>
      }
    >
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3 text-white">
              <Box className="h-5 w-5 text-muted-foreground" />
              Projects
            </h2>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search..." 
                   className="h-9 w-40 bg-white/[0.03] border-white/[0.08] rounded-xl pl-9 text-xs font-bold"
                 />
               </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 sm:grid-cols-2"
          >
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/dashboard/projects/${project.id}`}>
                  <PremiumCard glow className="h-full">
                    <PremiumCardContent className="p-8 flex flex-col justify-between h-full">
                      <div className="space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-2xl ring-1 ring-white/20 shrink-0">
                            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-black translate-y-[0.5px]" />
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-black tracking-tighter text-white truncate mb-1">
                            {project.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-bold tracking-tight uppercase truncate">
                            {project.repoUrl.replace('https://github.com/', '')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center justify-between text-muted-foreground border-t border-white/[0.05] pt-6">
                        <div className="flex items-center gap-2">
                           <GitBranch className="h-3.5 w-3.5" />
                           <span className="text-xs font-bold">main</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                          {formatDistanceToNow(new Date(project.createdAt))} ago
                        </span>
                      </div>
                    </PremiumCardContent>
                  </PremiumCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Sidebar Activity */}
        <aside className="space-y-10">
           <section className="space-y-6">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Resource Usage</h3>
              <PremiumCard variant="glass">
                <PremiumCardContent className="space-y-8 p-8">
                  {[
                    { label: "Edge Requests", value: "3.5K", limit: "1M", progress: 5, color: "bg-blue-500" },
                    { label: "Origin Transfer", value: "11.1 MB", limit: "10 GB", progress: 12, color: "bg-purple-500" },
                    { label: "Function Invocations", value: "845", limit: "1M", progress: 1, color: "bg-emerald-500" },
                  ].map((item) => (
                    <div key={item.label} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                        <span className="text-xs font-black text-white">{item.value} <span className="text-muted-foreground font-medium opacity-50">/ {item.limit}</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={cn("h-full rounded-full relative shadow-lg", item.color)}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                        </motion.div>
                      </div>
                    </div>
                  ))}
                  
                  <Button className="w-full h-12 rounded-2xl bg-white text-black font-black text-xs hover:bg-zinc-200 border-0 transition-all mt-4">
                    View Detailed Analytics
                  </Button>
                </PremiumCardContent>
              </PremiumCard>
           </section>

           <section className="space-y-6">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Recent Activity</h3>
              <div className="space-y-4">
                 {recentActivity.length > 0 ? (
                   recentActivity.map((item) => (
                    <PremiumCard key={item.id} variant="subtle" className="hover:bg-white/[0.03]">
                        <PremiumCardContent className="p-4 flex items-center gap-4">
                           <div className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center shrink-0 border border-white/[0.05]">
                              <ActivityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black text-white truncate"><span className="text-muted-foreground">{item.action}</span> {item.target}</p>
                              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
                                {formatDistanceToNow(new Date(item.createdAt))} ago
                              </p>
                           </div>
                        </PremiumCardContent>
                    </PremiumCard>
                   ))
                 ) : (
                   <p className="text-[10px] font-bold text-muted-foreground px-1 uppercase tracking-widest italic">No recent activity</p>
                 )}
              </div>
           </section>

           <section className="space-y-6">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">Latest Previews</h3>
              <div className="space-y-4">
                 {recentDeployments.map((dep) => (
                   <Link key={dep.id} href={`/dashboard/deployments/${dep.id}`}>
                    <PremiumCard variant="subtle" className="hover:bg-white/[0.03]">
                        <PremiumCardContent className="p-4 flex items-center gap-4">
                           <div className={cn(
                             "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.08]",
                             dep.status === 'ready' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                           )}>
                              {dep.status === 'ready' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                           </div>
                           <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black text-white truncate">{dep.commitMessage || "Branch Deployment"}</p>
                              <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter mt-0.5">
                                {dep.projectName} • {formatDistanceToNow(new Date(dep.createdAt))} ago
                              </p>
                           </div>
                        </PremiumCardContent>
                    </PremiumCard>
                   </Link>
                 ))}
              </div>
           </section>
        </aside>
      </div>
    </DashboardPage>
  );
}
