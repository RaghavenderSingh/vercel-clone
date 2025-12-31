"use client";

import { useState } from "react";
import { Terminal, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectsAPI } from "@/lib/api";
import { toast } from "sonner";

interface BuildSettingsProps {
  projectId: string;
  initialConfig: {
    buildCommand: string;
    installCommand: string;
  };
}

export function BuildSettings({ projectId, initialConfig }: BuildSettingsProps) {
  const [buildCommand, setBuildCommand] = useState(initialConfig.buildCommand);
  const [installCommand, setInstallCommand] = useState(initialConfig.installCommand);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await projectsAPI.updateBuildConfig(projectId, {
        buildCommand,
        installCommand,
      });
      toast.success("Build settings saved");
    } catch (error) {
      toast.error("Failed to save build settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter mb-2">Build & Output Settings</h2>
        <p className="text-muted-foreground font-bold">Configure how your project is built and served.</p>
      </div>
      
      <div className="rounded-[2rem] border border-border bg-card/40 p-10 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Build Command</label>
            <div className="relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                className="h-14 pl-12 bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Install Command</label>
            <div className="relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={installCommand}
                onChange={(e) => setInstallCommand(e.target.value)}
                className="h-14 pl-12 bg-muted/20 border-border/40 rounded-2xl focus-visible:ring-1 focus-visible:ring-primary font-mono text-sm"
              />
            </div>
          </div>
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
