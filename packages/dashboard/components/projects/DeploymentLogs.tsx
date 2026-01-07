"use client";

import { useEffect, useState, useRef } from "react";
import { Terminal, Download, Copy, Check, Info } from "lucide-react";
import { useDeploymentLogs } from "@/lib/useSocket";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DeploymentLogsProps {
  deploymentId: string;
  initialLogs?: string;
  status: string;
}

export function DeploymentLogs({ deploymentId, initialLogs, status }: DeploymentLogsProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialLogs) {
      setLogs(initialLogs.split('\n'));
    }
  }, [initialLogs]);

  useDeploymentLogs(deploymentId, (log) => {
    setLogs((prev) => [...prev, log]);
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([logs.join('\n')], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deployment-${deploymentId}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-[2rem] border border-white/5 bg-black/20 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Deployment Console
        </h3>
        <div className="flex items-center gap-2">
           {status === 'building' && (
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Building</span>
             </div>
           )}
           {status === 'ready' && (
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live</span>
             </div>
           )}
           {status === 'error' && (
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Failed</span>
             </div>
           )}
           
          <div className="h-4 w-px bg-white/10 mx-2" />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/10"
            onClick={handleCopy}
            title="Copy Logs"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-white/10"
            onClick={handleDownload}
            title="Download Logs"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative group">
        <ScrollArea 
            ref={scrollRef}
            className="h-[400px] w-full rounded-xl border border-white/5 bg-black/80 shadow-inner shadow-black/50"
            onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
                const target = e.target as HTMLElement;
                const isBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 10;
                setAutoScroll(isBottom);
            }}
        >
            <div className="p-4 font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 text-zinc-600 space-y-2">
                        <Terminal className="h-6 w-6 opacity-50" />
                        <p>Waiting for logs...</p>
                    </div>
                ) : (
                    logs.map((log, i) => (
                        <div key={i} className="leading-relaxed break-all whitespace-pre-wrap">
                            {formatLogLine(log)}
                        </div>
                    ))
                )}
            </div>
        </ScrollArea>
        {!autoScroll && status === 'building' && (
            <Button
                variant="secondary"
                size="sm"
                onClick={() => setAutoScroll(true)}
                className="absolute bottom-4 right-4 h-7 text-xs shadow-lg animate-in fade-in slide-in-from-bottom-2"
            >
                Resume Auto-scroll
            </Button>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-[10px] text-zinc-600">
        <Info className="h-3 w-3" />
        <p>Logs are streamed in real-time and persisted for debugging.</p>
      </div>
    </section>
  );
}

function formatLogLine(log: string) {
    if (log.includes('ERROR') || log.includes('Error') || log.includes('failed')) {
        return <span className="text-red-400">{log}</span>;
    }
    if (log.includes('WARN')) {
        return <span className="text-amber-400">{log}</span>;
    }
    if (log.includes('✓') || log.includes('success')) {
        return <span className="text-emerald-400">{log}</span>;
    }
    if (log.includes('info')) {
        return <span className="text-blue-300">{log}</span>;
    }
    return <span className="text-zinc-300">{log}</span>;
}
