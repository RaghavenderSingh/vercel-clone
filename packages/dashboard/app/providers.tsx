"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TokenSyncer />
        {children}
        <Toaster position="bottom-right" theme="dark" richColors closeButton />
      </ThemeProvider>
    </SessionProvider>
  );
}

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAuthToken, fetchCsrfToken } from "@/lib/api";

function TokenSyncer() {
    const { data: session } = useSession();

    useEffect(() => {
        console.log("[TokenSyncer] Session update:", session);
        if (session?.backendToken) {
            console.log("[TokenSyncer] Setting backend token to localStorage");
            setAuthToken(session.backendToken);

            fetchCsrfToken()
                .then(() => console.log("[TokenSyncer] CSRF token prefetched"))
                .catch((err) => console.warn("[TokenSyncer] Failed to prefetch CSRF token:", err));
        } else if (session === null) {
             console.log("[TokenSyncer] Clearing backend token");
             setAuthToken("");
        } else {
            console.log("[TokenSyncer] Session loaded but no backendToken found");
        }
    }, [session]);

    return null;
}

