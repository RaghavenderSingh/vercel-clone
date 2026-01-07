"use client";

import { useEffect, useState } from "react";
import { DashboardPage } from "@/components/dashboard-page";
import { PremiumCard, PremiumCardContent, PremiumCardHeader } from "@/components/ui/premium-card";
import { 
  Globe, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Copy,
  Trash2,
  RefreshCcw,
  Search,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { domainsAPI, projectsAPI } from "@/lib/api";

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  projectId: string;
  createdAt: string;
  project?: {
    name: string;
  };
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [domainsRes, projectsRes] = await Promise.all([
        domainsAPI.listAll(),
        projectsAPI.list()
      ]);
      setDomains(domainsRes.data);
      setProjects(projectsRes.data);
      if (projectsRes.data.length > 0) {
        setSelectedProjectId(projectsRes.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch domains data:", error);
      toast.error("Failed to load domains");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain || !selectedProjectId) return;
    try {
      const response = await domainsAPI.add(selectedProjectId, newDomain);
      setDomains([response.data, ...domains]);
      toast.success(`Domain ${newDomain} added!`);
      setNewDomain("");
      setIsAdding(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add domain");
    }
  };

  const handleVerify = async (domain: Domain) => {
    setVerifyingId(domain.id);
    try {
      await domainsAPI.verify(domain.projectId, domain.domain);
      toast.success(`Domain ${domain.domain} verified!`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRemove = async (domain: Domain) => {
    try {
      await domainsAPI.remove(domain.projectId, domain.domain);
      setDomains(domains.filter(d => d.id !== domain.id));
      toast.success("Domain removed");
    } catch (error: any) {
      toast.error("Failed to remove domain");
    }
  };

  return (
    <DashboardPage
      title="Domains"
      description="Connect your own domains to your projects. We'll handle the SSL certificates and routing."
      headerActions={
        <Button 
          onClick={() => setIsAdding(true)}
          className="h-11 px-6 bg-white text-black font-black text-sm hover:bg-white/90 rounded-2xl gap-3 shadow-2xl shadow-white/5"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          Add Domain
        </Button>
      }
    >
      <div className="max-w-5xl space-y-10">
        <AnimatePresence>
            {isAdding && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <PremiumCard variant="glass" className="border-primary/20 bg-primary/[0.02]">
                        <PremiumCardContent className="p-8">
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Domain Name</label>
                                    <Input 
                                        placeholder="example.com" 
                                        value={newDomain}
                                        onChange={(e) => setNewDomain(e.target.value)}
                                        className="h-12 bg-white/[0.03] border-white/[0.1] rounded-2xl text-base font-bold px-6 focus:border-white/20 transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Project</label>
                                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                        <SelectTrigger className="h-12 bg-white/[0.03] border-white/[0.1] rounded-2xl text-base font-bold px-6 focus:border-white/20 transition-all">
                                            <SelectValue placeholder="Select Project" />
                                        </SelectTrigger>
                                        <SelectContent className="glass-panel text-white border-white/[0.1]">
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id} className="focus:bg-white/[0.05] font-bold text-sm">{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setIsAdding(false)}
                                    className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-white"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleAddDomain}
                                    disabled={!newDomain || !selectedProjectId}
                                    className="h-12 px-8 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    Connect Domain
                                </Button>
                            </div>
                        </PremiumCardContent>
                    </PremiumCard>
                </motion.div>
            )}
        </AnimatePresence>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Syncing domain cluster...</p>
             </div>
        ) : (
            <div className="grid gap-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Connected Domains</h3>
                </div>

                <div className="grid gap-4">
                    {domains.length === 0 ? (
                        <PremiumCard variant="subtle">
                            <PremiumCardContent className="p-20 text-center">
                                <Globe className="w-12 h-12 text-muted-foreground/20 mx-auto mb-6" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">No Domains Yet</h3>
                                <p className="text-xs font-medium text-muted-foreground mt-2">Add a custom domain to your projects for a professional look.</p>
                            </PremiumCardContent>
                        </PremiumCard>
                    ) : domains.map((domain, idx) => (
                        <motion.div
                            key={domain.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <PremiumCard glow={domain.verified}>
                                <PremiumCardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.05] bg-white/[0.02]",
                                            domain.verified ? "text-emerald-500" : "text-amber-500"
                                        )}>
                                            <Globe className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-xl font-black tracking-tight text-white">{domain.domain}</h4>
                                                {domain.verified ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                        <AlertCircle className="h-3 w-3 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pending DNS</span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest uppercase italic">
                                                Linked to <span className="text-white">{domain.project?.name || "Unassigned"}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end md:self-center">
                                        {!domain.verified && (
                                            <Button 
                                                variant="outline" 
                                                onClick={() => handleVerify(domain)}
                                                disabled={verifyingId === domain.id}
                                                className="h-10 px-6 rounded-xl border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white gap-2 transition-all active:scale-95"
                                            >
                                                {verifyingId === domain.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
                                                Verify DNS
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-white rounded-xl">
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleRemove(domain)}
                                            className="h-10 w-10 text-muted-foreground hover:text-destructive rounded-xl transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </PremiumCardContent>
                                
                                {!domain.verified && (
                                    <div className="px-8 pb-8">
                                        <div className="bg-amber-500/[0.02] border border-amber-500/10 rounded-2xl p-6 space-y-4">
                                            <p className="text-[11px] font-black text-amber-500/70 uppercase tracking-widest">DNS Records Required</p>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Type</span>
                                                        <p className="text-sm font-bold text-white">CNAME</p>
                                                    </div>
                                                    <div className="space-y-1 flex-1 px-8">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Value</span>
                                                        <p className="text-sm font-bold text-white truncate">titan.curiousdev.xyz</p>
                                                    </div>
                                                    <Button 
                                                      size="icon" 
                                                      variant="ghost" 
                                                      className="h-8 w-8 rounded-lg"
                                                      onClick={() => {
                                                        navigator.clipboard.writeText("titan.curiousdev.xyz");
                                                        toast.info("Copied to clipboard");
                                                      }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                                <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Type</span>
                                                        <p className="text-sm font-bold text-white">A</p>
                                                    </div>
                                                    <div className="space-y-1 flex-1 px-8">
                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Value</span>
                                                        <p className="text-sm font-bold text-white">127.0.0.1</p>
                                                    </div>
                                                    <Button 
                                                      size="icon" 
                                                      variant="ghost" 
                                                      className="h-8 w-8 rounded-lg"
                                                      onClick={() => {
                                                        navigator.clipboard.writeText("127.0.0.1");
                                                        toast.info("Copied to clipboard");
                                                      }}
                                                    >
                                                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </PremiumCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        )}

        <PremiumCard variant="subtle" className="bg-blue-500/[0.01] border-blue-500/5">
            <PremiumCardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                    <RefreshCcw className="h-6 w-6" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h5 className="text-sm font-black text-white mb-1 uppercase tracking-tight">Automatic SSL Certificates</h5>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                        Titan automatically issues and renews SSL certificates for all connected domains using Let's Encrypt. No configuration required.
                    </p>
                </div>
                <Button variant="outline" className="h-10 px-6 rounded-xl border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/10">
                    Learn More
                </Button>
            </PremiumCardContent>
        </PremiumCard>
      </div>
    </DashboardPage>
  );
}
