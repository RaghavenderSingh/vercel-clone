"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Plus, MoreHorizontal, ChevronRight, Slash, Check, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <header className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-black/20">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group relative">
             <div className="absolute inset-0 bg-white/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-8 h-8 relative rounded-full bg-gradient-to-tr from-zinc-100 to-zinc-400 flex items-center justify-center shadow-lg shadow-white/5 transition-transform group-hover:scale-105">
              <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-black translate-y-[1px]" />
            </div>
          </Link>

          <div className="flex items-center text-sm font-medium">
             <div className="flex items-center gap-3 group cursor-pointer p-1.5 -ml-1.5 rounded-lg hover:bg-white/5 transition-all duration-300">
                <div className="relative">
                    <img
                        src={session?.user?.image || "https://avatar.vercel.sh/user"}
                        className="w-6 h-6 rounded-full border border-white/10 group-hover:border-white/30 transition-colors"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-white font-bold text-xs leading-none">
                        {session?.user?.name?.toLowerCase().replace(" ", "")}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium leading-none">Hobby Plan</span>
                </div>
             </div>
             
             <Slash className="h-4 w-4 text-white/5 -rotate-12 mx-2" />
             
             <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
                <span className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">Project-test</span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <Button
                variant="outline" 
                onClick={() => toast.info("Global search is coming soon!")}
                className="h-9 relative w-full md:w-64 justify-start bg-black/50 border-white/10 text-muted-foreground hover:bg-white/5 hover:text-white transition-all group"
            >
                <Search className="mr-2 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="text-xs font-medium">Search...</span>
                <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex text-white/50">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            
            <div className="h-6 w-px bg-white/10 mx-1" />

            <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => toast.info("Notifications are coming soon!")}
                className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors"
            >
                <Bell className="h-4 w-4" />
            </Button>

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="h-9 w-9 rounded-full border border-white/10 p-[2px] cursor-pointer hover:border-white/30 transition-all ml-1">
                    <img
                        src={session?.user?.image || "https://avatar.vercel.sh/user"}
                        className="w-full h-full rounded-full bg-white/5"
                    />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0A0A0A] border-white/10 text-white rounded-xl shadow-2xl p-2">
                <div className="flex items-center gap-3 p-2 mb-1">
                    <div className="h-8 w-8 rounded-full border border-white/10 overflow-hidden">
                        <img
                            src={session?.user?.image || "https://avatar.vercel.sh/user"}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="grid gap-0.5">
                        <p className="text-sm font-medium leading-none text-white">{session?.user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    </div>
                </div>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 py-1.5">My Account</DropdownMenuLabel>
                <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-white rounded-lg text-xs font-medium px-2 py-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-white/5 border border-white/5">
                                <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-white/70" />
                            </div>
                            Dashboard
                        </div>
                    </DropdownMenuItem>
                </Link>
                <Link href="/dashboard/settings">
                    <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-white rounded-lg text-xs font-medium px-2 py-2">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-white/5 border border-white/5">
                                <Settings className="h-3 w-3 text-white/70" />
                            </div>
                            Settings
                        </div>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-red-400 rounded-lg text-xs font-medium px-2 py-2 group"
                >
                    <div className="flex items-center gap-2">
                         <div className="p-1 rounded bg-red-500/10 border border-red-500/10 group-focus:border-red-500/20">
                            <LogOut className="h-3 w-3" />
                         </div>
                         Log Out
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      {!pathname.match(/\/dashboard\/projects\/[^/]+/) && (
      <div className="container overflow-x-auto no-scrollbar">
        <nav className="flex items-center h-12 gap-1 px-4 md:px-6 transition-all scroll-smooth">
          {NAV_ITEMS.map((item) => {
            const href =
              item === "Overview"
                ? "/dashboard"
                : `/dashboard/${item.toLowerCase()}`;
            const isActive = pathname === href;
            return (
              <Link
                key={item}
                href={href}
                className={`
                    relative px-3 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200
                    ${isActive 
                        ? "text-white" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }
                `}
              >
                {isActive && (
                    <span className="absolute inset-0 bg-white/10 rounded-full border border-white/5" />
                )}
                <span className="relative z-10">{item}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      )}
    </header>
  );
}
