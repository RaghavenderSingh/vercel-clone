"use client";

import React from "react";
import { ChevronRight, Slash } from "lucide-react";
import Link from "lucide-react";
import NextLink from "next/link";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DashboardPageProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function DashboardPage({
  title,
  description,
  breadcrumbs,
  headerActions,
  children,
  footer,
  className,
}: DashboardPageProps) {
  return (
    <div className={cn("flex flex-col min-h-full w-full", className)}>
      {/* Page Header Area */}
      <div className="border-b border-white/[0.05] bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-8 py-6 md:py-10">
          <div className="space-y-4">
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <NextLink 
                  href="/dashboard" 
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </NextLink>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <Slash className="h-3 w-3 text-white/10 -rotate-12" />
                    {crumb.href ? (
                      <NextLink 
                        href={crumb.href}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </NextLink>
                    ) : (
                      <span className="text-foreground">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
                  {title}
                </h1>
                {description && (
                  <p className="text-sm md:text-base text-muted-foreground font-medium max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
              
              {headerActions && (
                <div className="flex items-center gap-3 shrink-0">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col">
        <div className="container mx-auto px-4 md:px-8 py-8 md:py-12 flex-1">
          {children}
        </div>
      </div>

      {/* Optional Footer */}
      {footer && (
        <div className="border-t border-white/[0.05] bg-black/10">
          <div className="container mx-auto px-4 md:px-8 py-6">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
