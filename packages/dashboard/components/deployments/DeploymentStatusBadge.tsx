"use client";

import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

interface DeploymentStatusProps {
  status: string;
}

export function DeploymentStatusBadge({ status }: DeploymentStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ready":
        return {
          icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          label: "Ready"
        };
      case "building":
        return {
          icon: Loader2,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          label: "Building",
          animate: true
        };
      case "queued":
        return {
          icon: Clock,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          label: "Queued"
        };
      case "error":
        return {
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          label: "Error"
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-500",
          bg: "bg-gray-500/10",
          border: "border-gray-500/20",
          label: status
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
      <Icon className={`w-4 h-4 ${config.animate ? "animate-spin" : ""}`} />
      <span className="text-sm font-bold uppercase tracking-wider">{config.label}</span>
      {status === 'ready' && <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
    </div>
  );
}
