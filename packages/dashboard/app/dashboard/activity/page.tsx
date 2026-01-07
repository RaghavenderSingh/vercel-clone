"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/dashboard-page";
import { PremiumCard, PremiumCardContent } from "@/components/ui/premium-card";
import { 
  Activity as ActivityIcon, 
  GitBranch, 
  Settings, 
  Globe, 
  ShieldCheck, 
  RefreshCcw,
  Clock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { activityAPI } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

const ACTIVITY_TYPES = {
  deployment: {
    icon: RefreshCcw,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  project: {
    icon: Globe,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  settings: {
    icon: Settings,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  security: {
    icon: ShieldCheck,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  }
};

interface Activity {
  id: string;
  type: string;
  action: string;
  target: string;
  metadata?: string;
  createdAt: string;
  user: {
     name: string;
     email: string;
  };
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await activityAPI.list();
      setActivities(response.data);
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardPage
      title="Activity"
      description="A real-time audit log of everything happening across your Titan infrastructure."
    >
      <div className="max-w-4xl space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <Loader2 className="w-10 h-10 text-primary animate-spin opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Loading Feed...</p>
          </div>
        ) : activities.length === 0 ? (
          <PremiumCard variant="subtle">
             <PremiumCardContent className="p-20 text-center">
                <ActivityIcon className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">No Activity Yet</h3>
                <p className="text-xs font-medium text-muted-foreground mt-2">Activity will appear here as you interact with your projects.</p>
             </PremiumCardContent>
          </PremiumCard>
        ) : (
          <PremiumCard>
            <PremiumCardContent className="p-0">
               <div className="divide-y divide-white/[0.05]">
                  {activities.map((item, idx) => {
                    const activityConfig = ACTIVITY_TYPES[item.type as keyof typeof ACTIVITY_TYPES] || ACTIVITY_TYPES.project;
                    const TypeIcon = activityConfig.icon;
                    return (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group flex items-center gap-6 p-6 hover:bg-white/[0.02] transition-colors"
                      >
                         <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.05]",
                           activityConfig.bg,
                           activityConfig.color
                         )}>
                            <TypeIcon className="h-5 w-5" />
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <span className="text-sm font-black text-white capitalize">{item.user?.name || item.user?.email.split('@')[0] || "User"}</span>
                               <span className="text-sm text-muted-foreground font-medium">{item.action}</span>
                               <span className="text-sm font-black text-white">{item.target}</span>
                            </div>
                            <div className="flex items-center gap-3">
                               {item.metadata && (
                                 <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.05]">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">{item.metadata}</span>
                                 </div>
                               )}
                               <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-[10px] font-bold uppercase tracking-tight">{formatDistanceToNow(new Date(item.createdAt))} ago</span>
                                </div>
                            </div>
                         </div>

                         <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-white transition-colors">
                               Details
                            </button>
                         </div>
                      </motion.div>
                    );
                  })}
               </div>
            </PremiumCardContent>
          </PremiumCard>
        )}
        
        {!loading && activities.length > 0 && (
          <div className="flex justify-center py-4">
             <button 
               onClick={fetchActivities}
               className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white transition-colors flex items-center gap-2 group"
             >
                <RefreshCcw className="h-3 w-3 group-hover:rotate-180 transition-transform duration-500" />
                Refresh Activity
             </button>
          </div>
        )}
      </div>
    </DashboardPage>
  );
}
