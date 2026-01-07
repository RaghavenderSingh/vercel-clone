"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  "Overview",
  "Integrations",
  "Deployments",
  "Activity",
  "Domains",
  "Usage",
  "Observability",
  "Storage",
  "Flags",
  "Support",
  "Settings",
];

export function DashboardNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/[0.05] supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3 group relative">
            <div className="w-9 h-9 relative rounded-xl bg-primary text-background flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105 active:scale-95">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-current translate-y-[0.5px]" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">Titan.</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.slice(0, 6).map((item) => {
              const href =
                item === "Overview"
                  ? "/dashboard"
                  : `/dashboard/${item.toLowerCase()}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={item}
                  href={href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300",
                    isActive 
                      ? "text-white" 
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.span 
                        layoutId="nav-active"
                        className="absolute inset-0 bg-white/[0.05] rounded-full border border-white/[0.08]" 
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center">
                <Button
                    variant="ghost" 
                    onClick={() => toast.info("Global search is coming soon!")}
                    className="h-10 w-10 lg:w-40 lg:justify-start bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] rounded-xl text-muted-foreground hover:text-white transition-all group p-0 lg:px-3"
                >
                    <Search className="lg:mr-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="hidden lg:inline text-xs font-bold tracking-tight">Search...</span>
                    <kbd className="hidden lg:flex pointer-events-none absolute right-2 top-2.5 h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[9px] font-medium opacity-50">
                        ⌘K
                    </kbd>
                </Button>
            </div>
            
            <Button 
                size="icon" 
                variant="ghost" 
                className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/[0.05] rounded-xl transition-all"
            >
                <Bell className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="h-10 w-10 rounded-xl border border-white/[0.08] p-1 cursor-pointer hover:bg-white/[0.05] transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <img
                        src={session?.user?.image || `https://avatar.vercel.sh/${session?.user?.email || 'user'}`}
                        className="w-full h-full rounded-lg bg-muted object-cover"
                    />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass-panel text-white rounded-2xl shadow-3xl p-2 mt-2">
                <div className="flex items-center gap-3 p-3 mb-1">
                    <div className="h-10 w-10 rounded-lg border border-white/10 overflow-hidden shrink-0">
                        <img
                            src={session?.user?.image || `https://avatar.vercel.sh/${session?.user?.email || 'user'}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="grid gap-0.5 min-w-0">
                        <p className="text-sm font-black leading-none text-white truncate">{session?.user?.name}</p>
                        <p className="text-[11px] leading-none text-muted-foreground truncate font-medium">{session?.user?.email}</p>
                    </div>
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1" />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-black px-3 py-3">Navigation</DropdownMenuLabel>
                <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer focus:bg-white/[0.05] focus:text-white rounded-xl text-xs font-bold px-3 py-2.5 mb-1">
                        <User className="h-4 w-4 mr-3 text-muted-foreground" />
                        Dashboard Overview
                    </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings">
                    <DropdownMenuItem className="cursor-pointer focus:bg-white/[0.05] focus:text-white rounded-xl text-xs font-bold px-3 py-2.5 mb-1">
                        <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                        Settings & Profile
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-white/5 mx-1" />
                <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer focus:bg-destructive/10 focus:text-destructive text-destructive rounded-xl text-xs font-bold px-3 py-2.5 mt-1"
                >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout Account
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
