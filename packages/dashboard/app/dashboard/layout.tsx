"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { authAPI } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const syncToken = async () => {
      if (session?.user?.email) {
        const token = localStorage.getItem("token");
        if (!token) {
            try {
                const { data } = await authAPI.login(session.user.email, session.user.name || undefined);
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }
            } catch (error) {
                console.error("Failed to sync token:", error);
            }
        }
      }
    };
    syncToken();
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-primary/30 font-sans tracking-tight">
      <DashboardNavbar />
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
    </div>
  );
}
