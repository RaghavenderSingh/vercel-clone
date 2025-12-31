"use client";

import { useState, useEffect } from "react";
import { Plus, Trash, Globe, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { domainsAPI } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  createdAt: string;
}

interface DomainSettingsProps {
  projectId: string;
}

export function DomainSettings({ projectId }: DomainSettingsProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, [projectId]);

  const fetchDomains = async () => {
    try {
      const { data } = await domainsAPI.list(projectId);
      setDomains(data);
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newDomain) return;
    setAdding(true);
    try {
      await domainsAPI.add(projectId, newDomain);
      toast.success("Domain added");
      setNewDomain("");
      fetchDomains();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add domain");
    } finally {
      setAdding(false);
    }
  };

  const handleVerify = async (domain: string) => {
    setVerifying(domain);
    try {
      await domainsAPI.verify(projectId, domain);
      toast.success("Domain verified");
      fetchDomains();
    } catch (error) {
      toast.error("Failed to verify domain");
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (domain: string) => {
    try {
      await domainsAPI.remove(projectId, domain);
      toast.success("Domain removed");
      fetchDomains();
    } catch (error) {
      toast.error("Failed to remove domain");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter mb-2">Domains</h2>
        <p className="text-muted-foreground font-bold">
            Manage custom domains for your project. Add a domain and verify ownership to enable SSL.
        </p>
      </div>

      <div className="rounded-[2rem] border border-border bg-card/40 p-10 space-y-8">
        <div className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Domain Name</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="h-14 pl-12 bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!newDomain || adding} className="h-14 px-8 rounded-2xl font-bold">
            {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </div>

        <div className="space-y-3">
          {loading ? (
             <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
             </div>
          ) : (
             <AnimatePresence initial={false}>
                {domains.map((d) => (
                    <motion.div 
                        key={d.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/10 border border-white/5"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${d.verified ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-500'}`} />
                            <span className="font-mono text-sm text-zinc-300">{d.domain}</span>
                            {!d.verified && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Unverified</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                             {!d.verified && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVerify(d.domain)}
                                    disabled={verifying === d.domain}
                                    className="h-8 text-xs font-bold border-white/10"
                                >
                                    {verifying === d.domain ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <CheckCircle2 className="h-3 w-3 mr-2" />}
                                    Verify
                                </Button>
                             )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(d.domain)}
                                className="hover:bg-red-500/10 hover:text-red-400 rounded-lg"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
             </AnimatePresence>
          )}
          
          {!loading && domains.length === 0 && (
                <div className="text-center py-10 text-muted-foreground font-bold italic border-2 border-dashed border-white/5 rounded-xl">
                    No custom domains added yet.
                </div>
           )}
        </div>
      </div>
    </div>
  );
}
