"use client";

import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeploymentTerminalProps {
  logs: string[];
  status: string;
}

export function DeploymentTerminal({ logs, status }: DeploymentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && (status === 'building' || status === 'queued')) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, status]);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    toast.success("Logs copied to clipboard");
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-[#0a0a0a] shadow-2xl">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2">
           <div className="flex gap-1.5">
             <div className="w-3 h-3 rounded-full bg-red-500/80" />
             <div className="w-3 h-3 rounded-full bg-amber-500/80" />
             <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
           </div>
           <span className="text-xs text-muted-foreground font-mono ml-3">build.log</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={copyLogs}>
            <Copy className="h-3.5 h-3.5" />
        </Button>
      </div>

      {/* Terminal Content */}
      <div 
        ref={scrollRef}
        className="p-6 h-[500px] overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
      >
        {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50">
                {status === 'queued' ? (
                     <>
                        <div className="text-4xl mb-4 animate-pulse">⏳</div>
                        <p>Waiting for build worker...</p>
                     </>
                ) : status === 'building' ? (
                    <>
                        <div className="text-4xl mb-4 animate-spin">⟳</div>
                        <p>Initializing build environment...</p>
                     </>
                ) : (
                    <p>No logs available</p>
                )}
            </div>
        ) : (
            logs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                    <span className="text-white/20 select-none w-8 text-right shrink-0">{i + 1}</span>
                    <span className={`${log.toLowerCase().includes('error') ? 'text-red-400' : log.toLowerCase().includes('success') ? 'text-emerald-400' : 'text-gray-300'} break-all`}>
                        {log}
                    </span>
                </div>
            ))
        )}
      </div>
    </div>
  );
}
