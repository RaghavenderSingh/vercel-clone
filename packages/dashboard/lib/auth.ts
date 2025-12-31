import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // 1. Initial Sign In
      if (account) {
        token.accessToken = account.access_token as string;
        token.githubId = (profile as any)?.id;
      }

      // 2. Fetch Backend Token if missing
      if (!token.backendToken) {
        const email = token.email || (profile as any)?.email;
        const name = token.name || (profile as any)?.name || (profile as any)?.login;

        if (email) {
            try {
                console.log("[Auth] Attempting to fetch backend token for:", email);
                const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                
                const response = await fetch(`${apiUrl}/api/auth/oauth/callback`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email,
                      name,
                      githubId: (profile as any)?.id?.toString(),
                      avatar: (profile as any)?.avatar_url
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("[Auth] Successfully fetched backend token");
                    token.backendToken = data.token;
                    token.userId = data.user.id;
                } else {
                    console.error("[Auth] Failed to login to backend:", response.status, await response.text());
                }
            } catch (error) {
                console.error("[Auth] Error checking backend token:", error);
            }
        } else {
            console.warn("[Auth] No email found in token, skipping backend login");
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.backendToken = token.backendToken;
      session.user.githubId = token.githubId;
      session.user.id = token.userId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
