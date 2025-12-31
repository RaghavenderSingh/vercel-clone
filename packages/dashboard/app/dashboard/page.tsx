"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { projectsAPI, deploymentsAPI } from "@/lib/api";
import Link from "next/link";
import { BorderBeam } from "@/components/ui/border-beam";
import { 
  Plus, 
  Github, 
  ExternalLink, 
  MoreVertical, 
  Search, 
  Bell, 
  Grid, 
  List as ListIcon, 
  ChevronRight,
  Zap,
  Activity,
  Clock,
  CheckCircle2,
  TrendingUp,
  Box,
  Cpu,
  Globe,
  MoreHorizontal,
  GitBranch
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

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
  }, [status]);

  const fetchData = async () => {
    try {
      const [projectsRes, deploymentsRes] = await Promise.all([
        projectsAPI.list(),
        deploymentsAPI.list()
      ]);
      setProjects(projectsRes.data);
      setRecentDeployments(deploymentsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 md:px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            {/* Sidebar Column */}
            <aside className="space-y-10">
                <section className="space-y-4">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Usage</h3>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                        <div className="p-4 space-y-4">
                            <div className="flex justify-between items-center bg-white/[0.03] p-2 rounded-lg">
                                <span className="text-[11px] font-medium text-white/70">Last 30 days</span>
                                <Button size="sm" className="h-6 px-3 bg-white text-black text-[10px] font-bold hover:bg-white/90 rounded-md">Upgrade</Button>
                            </div>
                            <div className="space-y-4 px-1">
                                {[
                                    { label: "Edge Requests", value: "3.5K", limit: "1M", progress: 5 },
                                    { label: "Fast Origin Transfer", value: "11.1 MB", limit: "10 GB", progress: 12 },
                                    { label: "Edge Middleware", value: "875", limit: "1M", progress: 2 },
                                    { label: "Function Invocations", value: "845", limit: "1M", progress: 1 },
                                ].map((item) => (
                                    <div key={item.label} className="space-y-1.5">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-white/40">{item.label}</span>
                                            <span className="text-white/70 font-medium">{item.value} / {item.limit}</span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-blue-500 rounded-full transition-all duration-1000 relative ${item.progress > 10 ? 'shadow-[0_0_10px_rgba(59,130,246,0.8)]' : ''}`} 
                                                style={{ width: `${item.progress}%` }} 
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Alerts</h3>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center space-y-4">
                        <div className="mx-auto w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-white/30" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-white/90">Get alerted for anomalies</p>
                            <p className="text-[11px] text-white/40 leading-relaxed">Automatically monitor your projects for anomalies and get notified.</p>
                        </div>
                        <Button variant="outline" className="w-full h-9 rounded-lg border-white/10 bg-white/5 text-[11px] font-bold hover:bg-white/10">
                            Upgrade to Observability
                        </Button>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest pl-1">Recent Previews</h3>
                    <div className="space-y-4">
                        {projects.slice(0, 3).map(p => (
                            <div key={p.id} className="group relative rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden aspect-video border-dashed flex items-center justify-center hover:bg-white/[0.03] transition-colors cursor-pointer">
                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-colors">Preview {p.name}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </aside>

            {/* Main Content Column */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input 
                            placeholder="Search Projects..." 
                            className="h-10 pl-11 bg-transparent border-white/10 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-white/20"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="h-10 w-10 border-white/10 bg-white/[0.02] hover:bg-white/5">
                            <ListIcon className="h-4 w-4 text-white/60" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-10 w-10 border-white/10 bg-white/[0.02] hover:bg-white/5">
                            <Grid className="h-4 w-4 text-white/60" />
                        </Button>
                        <Link href="/dashboard/new">
                            <Button className="h-10 px-4 bg-white text-black font-bold text-sm hover:bg-white/90 rounded-lg gap-2">
                                Add Project
                                <Plus className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, staggerChildren: 0.1 }}
                    className="grid gap-5 md:grid-cols-2"
                >
                    {projects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link href={`/dashboard/projects/${project.id}`} className="group block relative rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all overflow-hidden h-full">
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-2xl">
                                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-black" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[15px] text-white group-hover:text-primary transition-colors tracking-tight">{project.name}</h3>
                                                <p className="text-[11px] text-white/40 font-medium">{project.name.toLowerCase()}.deply.app</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/5">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                                                <Github className="h-3 w-3 text-white/40" />
                                            </div>
                                            <p className="text-[11px] font-medium text-white/50">{project.repoUrl.replace('https://github.com/', '')}</p>
                                        </div>
                                        <div className="space-y-1.5 pl-0.5">
                                            <p className="text-[11px] font-bold text-white/80">build fix</p>
                                            <p className="text-[10px] text-white/40 font-medium">Sep 18 on <GitBranch className="h-2.5 w-2.5 inline mx-0.5" /> main</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    </main>
  );
}



