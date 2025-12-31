"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { projectsAPI } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DangerZoneProps {
  projectId: string;
}

export function DangerZone({ projectId }: DangerZoneProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      await projectsAPI.delete(projectId);
      toast.success("Project deleted");
      router.push("/dashboard/projects");
    } catch (error) {
      toast.error("Failed to delete project");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tighter mb-2 text-destructive">Danger Zone</h2>
        <p className="text-muted-foreground font-bold">Irreversible actions that affect your production infrastructure.</p>
      </div>
      <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-10 flex flex-col md:flex-row justify-between items-center gap-10">
        <div>
          <h4 className="text-xl font-black mb-1">Delete this Project</h4>
          <p className="text-muted-foreground text-sm font-bold">The project will be permanently removed, including all active deployments and edge domains.</p>
        </div>
        <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl px-10 h-12 font-black shadow-xl shadow-destructive/10 whitespace-nowrap"
        >
          {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Delete Project
        </Button>
      </div>
    </div>
  );
}
