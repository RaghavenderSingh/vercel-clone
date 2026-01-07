"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/dashboard-page";
import { PremiumCard, PremiumCardContent, PremiumCardHeader } from "@/components/ui/premium-card";
import { 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Server, 
  Globe, 
  Activity,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { usageAPI } from "@/lib/api";

interface TotalUsage {
  requests: number;
  bandwidth: number;
  invocations: number;
}

export default function UsagePage() {
  const [usage, setUsage] = useState<TotalUsage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await usageAPI.get();
      setUsage(response.data);
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatBandwidth = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <DashboardPage
      title="Usage"
      description="Track your resource consumption across compute, storage, and bandwidth in real-time."
    >
      <div className="space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing usage metrics...</p>
          </div>
        ) : (
          <>
            {/* Tier Overview Card */}
            <PremiumCard variant="glass" className="bg-primary/[0.01] border-primary/20">
               <PremiumCardContent className="p-10 flex flex-col md:flex-row items-center gap-12">
                  <div className="flex flex-col items-center gap-4 text-center">
                     <div className="w-20 h-20 rounded-3xl bg-white text-black flex items-center justify-center shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-shimmer" />
                        <CreditCard className="h-10 w-10 relative z-10" />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-white tracking-tighter">Hobby Plan</h3>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Free Tier</p>
                     </div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-10">
                     {[
                       { label: "Request Limit", value: `${(usage?.requests || 0).toLocaleString()} / 1M`, progress: (usage?.requests || 0) / 1000000 * 100 },
                       { label: "Bandwidth", value: `${formatBandwidth(usage?.bandwidth || 0)} / 10 GB`, progress: (usage?.bandwidth || 0) / (10 * 1024 * 1024 * 1024) * 100 },
                       { label: "Invocations", value: `${(usage?.invocations || 0).toLocaleString()} / 50k`, progress: (usage?.invocations || 0) / 50000 * 100 },
                       { label: "Compute", value: "0.0h / 100h", progress: 0 },
                     ].map(item => (
                       <div key={item.label} className="space-y-3">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                          <h4 className="text-lg font-black text-white tracking-tighter">{item.value.split(" / ")[0]}</h4>
                          <div className="h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${Math.min(item.progress, 100)}%` }}
                               transition={{ duration: 1.5, ease: "easeOut" }}
                               className="h-full bg-white rounded-full"
                             />
                          </div>
                       </div>
                     ))}
                  </div>
                  
                  <Button className="h-12 px-8 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-white/5 hover:scale-105 active:scale-95 transition-all shrink-0">
                     Upgrade to Pro
                  </Button>
               </PremiumCardContent>
            </PremiumCard>

            {/* Detailed Metrics */}
            <div className="grid gap-10 lg:grid-cols-2">
               <PremiumCard>
                  <PremiumCardHeader className="flex justify-between items-center">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        Compute Power
                     </h3>
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Updates</span>
                  </PremiumCardHeader>
                  <PremiumCardContent className="space-y-8 p-8">
                     <div className="aspect-[2/1] relative flex items-end gap-3 px-4">
                        {[30, 45, 25, 60, 40, 75, 55, 90, 65, 80, 45, 30].map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 1 }}
                            className="flex-1 bg-white/[0.05] hover:bg-primary/20 rounded-t-lg transition-colors relative group"
                          >
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {h}%
                             </div>
                          </motion.div>
                        ))}
                     </div>
                     <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Peak Utilization</p>
                           <h4 className="text-xl font-black text-white">0%</h4>
                        </div>
                        <div className="space-y-1 text-right">
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Idle Time</p>
                           <h4 className="text-xl font-black text-white">--</h4>
                        </div>
                     </div>
                  </PremiumCardContent>
               </PremiumCard>

               <PremiumCard>
                  <PremiumCardHeader className="flex justify-between items-center">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Globe className="h-4 w-4 text-blue-500" />
                        Network Transfer
                     </h3>
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Last 30 Days</span>
                  </PremiumCardHeader>
                  <PremiumCardContent className="p-10 space-y-10">
                     <div className="flex items-center gap-12">
                        <div className="flex-1 space-y-6">
                           <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-black text-white uppercase italic tracking-tight">Egress</span>
                                 <span className="text-xs font-bold text-muted-foreground">{formatBandwidth(usage?.bandwidth || 0)}</span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                 <div className="h-full w-[100%] bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-black text-white uppercase tracking-tight italic">Ingress</span>
                                 <span className="text-xs font-bold text-muted-foreground">0 B</span>
                              </div>
                              <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                                 <div className="h-full w-[0%] bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                              </div>
                           </div>
                        </div>
                        
                        <div className="w-32 h-32 rounded-full border-8 border-white/[0.03] flex flex-col items-center justify-center gap-1 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
                            <span className="text-2xl font-black text-white">{formatBandwidth(usage?.bandwidth || 0).split(' ')[0]}</span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{formatBandwidth(usage?.bandwidth || 0).split(' ')[1]} Total</span>
                        </div>
                     </div>
                     
                     <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <TrendingUp className="h-5 w-5" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">Resource Optimal</p>
                              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Your current usage is well within the free tier limits.</p>
                           </div>
                        </div>
                        <Button variant="ghost" onClick={fetchUsage} className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest hover:text-white">Refresh Metrics</Button>
                     </div>
                  </PremiumCardContent>
               </PremiumCard>
            </div>
          </>
        )}
      </div>
    </DashboardPage>
  );
}
