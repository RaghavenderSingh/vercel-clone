"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/dashboard-page";
import { PremiumCard, PremiumCardContent, PremiumCardHeader } from "@/components/ui/premium-card";
import { 
  BarChart3, 
  Activity, 
  Search, 
  Filter, 
  Terminal,
  Server,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { projectsAPI, observabilityAPI } from "@/lib/api";

interface Metrics {
  requests: number;
  bandwidth: number;
  invocations: number;
  errorRate: number;
  latency: number;
  status: string;
}

export default function ObservabilityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchMetrics(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.list();
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProjectId(response.data[0].id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setLoading(false);
    }
  };

  const fetchMetrics = async (projectId: string) => {
    setMetricsLoading(true);
    try {
      const response = await observabilityAPI.getMetrics(projectId);
      setMetrics(response.data);
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
    } finally {
      setMetricsLoading(false);
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <DashboardPage
     title="Observability"
     description="Real-time performance metrics, error tracking, and system health for your deployments."
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
           <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Initializing stream...</p>
        </div>
      ) : projects.length === 0 ? (
        <PremiumCard variant="subtle">
           <PremiumCardContent className="p-20 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">No Projects Found</h3>
              <p className="text-xs font-medium text-muted-foreground mt-2">Deploy a project to see observability data.</p>
           </PremiumCardContent>
        </PremiumCard>
      ) : (
        <div className="space-y-10">
          {/* Project Selector */}
          <div className="flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
             {projects.map(p => (
               <button
                 key={p.id}
                 onClick={() => setSelectedProjectId(p.id)}
                 className={cn(
                   "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                   selectedProjectId === p.id 
                    ? "bg-white text-black border-white shadow-xl shadow-white/10" 
                    : "bg-white/[0.03] text-muted-foreground border-white/[0.05] hover:bg-white/[0.05]"
                 )}
               >
                  {p.name}
               </button>
             ))}
          </div>

          {/* Real-time Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                label: "Request Rate", 
                value: `${metrics?.requests || 0}`, 
                unit: "/ 24h", 
                trend: "+12.5%", 
                trendColor: "text-emerald-500",
                icon: Zap,
                color: "text-amber-500"
              },
              { 
                label: "Error Rate", 
                value: `${(metrics?.errorRate || 0) * 100}%`, 
                unit: "avg", 
                trend: "-2.1%", 
                trendColor: "text-emerald-500",
                icon: AlertCircle,
                color: metrics?.errorRate && metrics.errorRate > 0.05 ? "text-red-500" : "text-emerald-500"
              },
              { 
                label: "Avg Latency", 
                value: `${metrics?.latency || 0}`, 
                unit: "ms", 
                trend: "+5ms", 
                trendColor: "text-red-500",
                icon: Activity,
                color: "text-blue-500"
              },
              { 
                label: "System Status", 
                value: metrics?.status === 'ready' ? "HEALTHY" : metrics?.status?.toUpperCase() || "IDLE", 
                unit: "uptime", 
                trend: "100%", 
                trendColor: "text-emerald-500",
                icon: ShieldCheck,
                color: metrics?.status === 'ready' ? "text-emerald-500" : "text-amber-500"
              },
            ].map((stat, i) => (
              <PremiumCard key={i} variant="subtle">
                 <PremiumCardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                       <div className={cn("p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]", stat.color)}>
                          <stat.icon className="h-4 w-4" />
                       </div>
                       <span className={cn("text-[10px] font-black tracking-tighter", stat.trendColor)}>{stat.trend}</span>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                       <div className="flex items-baseline gap-1 mt-1">
                          <h4 className="text-xl font-black text-white tracking-tighter">{stat.value}</h4>
                          <span className="text-[10px] font-bold text-muted-foreground">{stat.unit}</span>
                       </div>
                    </div>
                 </PremiumCardContent>
              </PremiumCard>
            ))}
          </div>

          <div className="grid gap-10 lg:grid-cols-3">
             {/* Main Chart Placeholder */}
             <div className="lg:col-span-2 space-y-10">
                <PremiumCard>
                  <PremiumCardHeader className="flex justify-between items-center py-6 px-8 border-b border-white/[0.05]">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Traffic Overview
                     </h3>
                     <div className="flex gap-2">
                        {['1H', '6H', '24H', '7D'].map(t => (
                          <button key={t} className={cn(
                            "px-3 py-1 rounded-lg text-[9px] font-black transition-colors",
                            t === '24H' ? "bg-white text-black" : "text-muted-foreground hover:text-white"
                          )}>{t}</button>
                        ))}
                     </div>
                  </PremiumCardHeader>
                  <PremiumCardContent className="p-10">
                     <div className="h-[300px] w-full flex items-end justify-between gap-1">
                        {Array.from({ length: 48 }).map((_, i) => (
                           <motion.div
                             key={i}
                             initial={{ height: 0 }}
                             animate={{ height: `${20 + Math.random() * 80}%` }}
                             transition={{ delay: i * 0.01 }}
                             className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-colors cursor-pointer group relative"
                           >
                              <div className="absolute -top-10 left-1/2 -track-x-1/2 bg-white text-black text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                 {Math.floor(Math.random() * 1000)} reqs
                              </div>
                           </motion.div>
                        ))}
                     </div>
                     <div className="flex justify-between mt-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        <span>24 Hours Ago</span>
                        <span>12 Hours Ago</span>
                        <span>Present</span>
                     </div>
                  </PremiumCardContent>
                </PremiumCard>

                <PremiumCard>
                  <PremiumCardHeader className="py-6 px-8 border-b border-white/[0.05]">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Terminal className="h-4 w-4 text-amber-500" />
                        Insight Stream
                     </h3>
                  </PremiumCardHeader>
                  <PremiumCardContent className="p-0">
                     <div className="bg-black/40 font-mono text-[11px] p-6 space-y-2 h-[200px] overflow-y-auto">
                        <div className="text-emerald-500/80">[SYSTEM] Stream connected to project: {selectedProject?.name}</div>
                        <div className="text-white/40">[14:23:01] GET /api/v1/health - 200 OK (12ms)</div>
                        <div className="text-white/40">[14:24:45] POST /api/v1/auth/callback - 204 No Content (45ms)</div>
                        <div className="text-amber-500/80">[14:25:12] WARN Slow response detected on /dashboard (340ms)</div>
                        <div className="text-white/40">[14:26:33] GET /api/v1/user/profile - 200 OK (18ms)</div>
                        <div className="text-red-500/80">[14:28:10] ERR Uncaught rejection: DatabaseTimeout at /api/data</div>
                        <div className="text-white/40">[14:30:05] GET /static/logo.png - 304 Not Modified (2ms)</div>
                        <div className="animate-pulse inline-block w-2 h-4 bg-primary align-middle ml-1" />
                     </div>
                  </PremiumCardContent>
                </PremiumCard>
             </div>

             {/* Diagnostics Sidebar */}
             <div className="space-y-10">
                <PremiumCard variant="glass" className="border-emerald-500/20 bg-emerald-500/[0.01]">
                   <PremiumCardHeader>
                      <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Health</h3>
                   </PremiumCardHeader>
                   <PremiumCardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-white">API Server</span>
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Operational</span>
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-white">Database Cluster</span>
                         <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase">1.2ms Latency</span>
                         </div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-white">Build Workers</span>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase">4 Active / 0 Queued</span>
                         </div>
                      </div>
                   </PremiumCardContent>
                </PremiumCard>

                <PremiumCard>
                   <PremiumCardHeader>
                      <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Performance Insights</h3>
                   </PremiumCardHeader>
                   <PremiumCardContent className="p-0">
                      <div className="divide-y divide-white/[0.05]">
                         {[
                           { title: "Optimize Static Assets", desc: "Serving images via Titan Edge CDN could reduce latency by 45%.", icon: Zap, color: "text-amber-500" },
                           { title: "Cold Start Detected", desc: "Function 'auth-verify' is experiencing cold starts. Enable warm-up.", icon: Clock, color: "text-blue-500" },
                           { title: "Query Optimization", desc: "Index suggested for 'Activity' table on 'userId' column.", icon: BarChart3, color: "text-purple-500" },
                         ].map((insight, i) => (
                           <div key={i} className="p-6 space-y-2 hover:bg-white/[0.01] transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                 <insight.icon className={cn("h-3.5 w-3.5", insight.color)} />
                                 <h4 className="text-xs font-black text-white group-hover:text-primary transition-colors">{insight.title}</h4>
                              </div>
                              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">{insight.desc}</p>
                           </div>
                         ))}
                      </div>
                   </PremiumCardContent>
                </PremiumCard>
             </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
}
