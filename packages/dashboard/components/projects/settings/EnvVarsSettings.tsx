"use client";

import { useState } from "react";
import { Plus, Trash, Key, Lock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectsAPI } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface EnvVarsSettingsProps {
  projectId: string;
  initialEnvVars: Record<string, string>;
  onUpdate: () => void;
}

export function EnvVarsSettings({ projectId, initialEnvVars, onUpdate }: EnvVarsSettingsProps) {
  const [envVars, setEnvVars] = useState<Record<string, string>>(initialEnvVars || {});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleAdd = () => {
    if (!newKey) return;
    setEnvVars({ ...envVars, [newKey]: newValue });
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = (key: string) => {
    const newVars = { ...envVars };
    delete newVars[key];
    setEnvVars(newVars);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectsAPI.updateBuildConfig(projectId, { envVars });
      toast.success("Environment variables saved");
      onUpdate();
    } catch (error) {
      toast.error("Failed to save environment variables");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter mb-2">Environment Variables</h2>
        <p className="text-muted-foreground font-bold">
          Configure environment variables for your project. These will be available at build time and runtime.
        </p>
      </div>

      <div className="rounded-[2rem] border border-border bg-card/40 p-10 space-y-8">
        <div className="flex gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Key</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="DATABASE_URL"
                className="h-14 pl-12 bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Value</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="postgres://user:pass@host:5432/db"
                className="h-14 pl-12 bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
              />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!newKey} className="h-14 px-8 rounded-2xl font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <div className="space-y-3">
            <AnimatePresence initial={false}>
            {Object.entries(envVars).map(([key, value]) => (
                <motion.div 
                    key={key}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/10 border border-white/5 group"
                >
                    <div className="flex-1 font-mono text-sm text-zinc-300">{key}</div>
                    <div className="flex-1 font-mono text-sm text-zinc-500 truncate" title={value}>{value}</div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(key)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-400 rounded-lg"
                    >
                        <Trash className="h-4 w-4" />
                    </Button>
                </motion.div>
            ))}
            </AnimatePresence>
            {Object.keys(envVars).length === 0 && (
                <div className="text-center py-10 text-muted-foreground font-bold italic border-2 border-dashed border-white/5 rounded-xl">
                    No environment variables configured.
                </div>
            )}
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl px-10 h-12 font-black shadow-lg shadow-primary/10"
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
