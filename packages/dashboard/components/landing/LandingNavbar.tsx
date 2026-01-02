"use client";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { NoiseBackground } from "@/components/ui/noise-background";
import { Search, Bell, LogOut, Settings, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function LandingNavbar() {
  const { status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "Pricing",
      link: "/pricing",
    },
    {
      name: "Blog",
      link: "/blog",
    },
  ];

  return (
    <Navbar>
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />

        <div className="flex items-center gap-4">
          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
         
              <div className="relative hidden lg:flex items-center group">
                <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Find..."
                  onClick={() => toast.info("Global search is coming soon!")}
                  className="h-8 w-44 pl-9 pr-8 rounded-md bg-white/5 border border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-black/40 hover:bg-white/10 hover:border-white/20 transition-all duration-200 placeholder:text-neutral-600 cursor-not-allowed"
                  readOnly
                />
                <div className="absolute right-2 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] text-neutral-500 font-mono pointer-events-none group-hover:border-white/20 transition-colors">
                  F
                </div>
              </div>

              {/* Feedback Button */}
              <Button
                variant="ghost"
                onClick={() => toast.info("Feedback portal is coming soon!")}
                className="hidden md:flex h-8 px-3 text-[13px] font-normal text-neutral-400 border border-transparent hover:text-white hover:bg-white/5 hover:border-white/10 transition-all duration-200 active:scale-[0.98]"
              >
                Feedback
              </Button>

              {/* Icons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toast.info("Notifications are coming soon!")}
                className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors duration-200 active:scale-95 group relative"
              >
                <Bell className="w-4 h-4" />
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-black group-hover:animate-pulse" />
              </Button>

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group relative w-7 h-7 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300 bg-gradient-to-br from-blue-500 to-purple-600 active:scale-95">
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-black/90 backdrop-blur-2xl border-white/10 text-neutral-300 p-1 shadow-2xl"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium px-3 py-2">
                    Personal Account
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5 mx-1" />
                  <Link href="/dashboard">
                    <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5 hover:bg-white/5 focus:bg-white/5 transition-colors group">
                      <LayoutDashboard className="mr-3 h-4 w-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
                      <span className="text-sm group-hover:text-blue-400  ">Dashboard</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2.5 hover:bg-white/5 focus:bg-white/5 transition-colors group">
                    <Settings className="mr-3 h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
                    <span className="text-sm group-hover:text-white">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5 mx-1" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md px-3 py-2.5 text-red-400/80 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400 transition-colors group"
                    onClick={() => signOut()}
                  >
                    <LogOut className=" group-hover:text-red-400 mr-3 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    <span className="text-sm group-hover:text-red-400">Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <NoiseBackground
              containerClassName="w-fit p-1 rounded-full"
              gradientColors={[
                "rgb(255, 100, 150)",
                "rgb(100, 150, 255)",
                "rgb(255, 200, 100)",
              ]}
            >
              <Link href="/login" className="w-full">
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="secondary"
                  className="h-7 rounded-full bg-black text-white px-6 font-medium border border-neutral-800 shadow-[0px_1px_0px_0px_var(--color-neutral-900)_inset] transition-all duration-300 active:scale-95 hover:bg-neutral-900"
                >
                  Log in
                </NavbarButton>
              </Link>
            </NoiseBackground>
          )}
        </div>
      </NavBody>

      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative py-2 text-lg font-medium text-neutral-400 hover:text-white transition-colors duration-200"
            >
              <span className="block">{item.name}</span>
            </a>
          ))}
          <div className="flex w-full flex-col gap-3">
            {status === "authenticated" ? (
              <>
                <Link href="/dashboard" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                    <div>
                      <div className="text-sm font-medium text-white">Personal Account</div>
                      <div className="text-xs text-neutral-500">View Dashboard</div>
                    </div>
                  </div>
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-3 p-3 w-full text-left rounded-lg text-red-400/80 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </>
            ) : (
              <NoiseBackground
                containerClassName="w-full p-1 rounded-full"
                gradientColors={[
                  "rgb(255, 100, 150)",
                  "rgb(100, 150, 255)",
                  "rgb(255, 200, 100)",
                ]}
              >
                <Link href="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <NavbarButton
                    variant="secondary"
                    className="h-11 w-full rounded-full bg-black text-white px-6 font-medium border border-neutral-800 shadow-[0px_1px_0px_0px_var(--color-neutral-900)_inset] transition-all duration-300 active:scale-95 hover:bg-neutral-900"
                  >
                    Log in
                  </NavbarButton>
                </Link>
              </NoiseBackground>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}
