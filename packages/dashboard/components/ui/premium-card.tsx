"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "glass" | "subtle";
  glow?: boolean;
}

export function PremiumCard({
  children,
  variant = "default",
  glow = false,
  className,
  ...props
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        variant === "default" && "premium-card",
        variant === "glass" && "glass-panel rounded-3xl",
        variant === "subtle" && "rounded-3xl border border-white/[0.04] bg-white/[0.01]",
        glow && "hover:shadow-[0_0_30px_rgba(255,255,255,0.03)]",
        className
      )}
      {...props}
    >
      {/* Subtle top light reflection */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      {children}
    </div>
  );
}

export function PremiumCardHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-6 py-5 border-b border-white/[0.05]", className)}>
      {children}
    </div>
  );
}

export function PremiumCardContent({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

export function PremiumCardFooter({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-6 py-4 bg-white/[0.01] border-t border-white/[0.05]", className)}>
      {children}
    </div>
  );
}
