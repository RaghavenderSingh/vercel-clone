"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell, Activity, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ComingSoonPage({ 
    title, 
    description,
    withHeader = true 
}: { 
    title: string, 
    description: string,
    withHeader?: boolean
}) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground transition-all duration-300">
      {withHeader && (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-foreground rounded-xl flex items-center justify-center">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-background" />
              </div>
              <span className="text-xl font-bold tracking-tight">Deploy.</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
              <Link href="/dashboard" className="text-muted-foreground transition-all hover:text-foreground/70">Overview</Link>
              <Link href="/dashboard/projects" className="text-muted-foreground transition-all hover:text-foreground/70">Projects</Link>
              <Link href="/dashboard/activity" className={`transition-all hover:text-foreground/70 ${title === 'Activity' ? 'text-foreground font-bold underline underline-offset-8 decoration-primary decoration-2' : 'text-muted-foreground'}`}>Activity</Link>
              <Link href="/dashboard/usage" className={`transition-all hover:text-foreground/70 ${title === 'Usage' ? 'text-foreground font-bold underline underline-offset-8 decoration-primary decoration-2' : 'text-muted-foreground'}`}>Usage</Link>
              <Link href="/dashboard/settings" className={`transition-all hover:text-foreground/70 ${title === 'Settings' ? 'text-foreground font-bold underline underline-offset-8 decoration-primary decoration-2' : 'text-muted-foreground'}`}>Settings</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="p-2 text-muted-foreground hover:text-foreground transition-all relative rounded-lg">
                <Bell className="h-5 w-5" />
            </button>
            <div className="h-6 w-px bg-border mx-2" />
            <img
              src={session?.user?.image || "https://avatar.vercel.sh/user"}
              className="w-8 h-8 rounded-full border border-border"
            />
          </div>
        </div>
      </header>
      )}

      <main className={`container mx-auto px-4 md:px-8 flex flex-col items-center justify-center text-center ${withHeader ? 'py-40' : 'py-20 h-[80vh]'}`}>
        <div className="w-32 h-32 bg-muted/20 rounded-[2.5rem] border border-border flex items-center justify-center mb-10 animate-bounce">
            <Construction className="h-16 w-16 text-primary/40" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-6">{title}</h1>
        <p className="text-muted-foreground text-xl max-w-xl font-medium mb-12">{description}</p>
        <div className="flex gap-4">
            <Link href="/dashboard">
                <Button variant="outline" size="lg" className="rounded-2xl px-10 h-14 font-black border-border hover:bg-muted/30">
                    Back to Dashboard
                </Button>
            </Link>
            <Button size="lg" className="rounded-2xl px-10 h-14 font-black shadow-2xl shadow-primary/20">
                Notify Me
            </Button>
        </div>
      </main>
    </div>
  );
}
