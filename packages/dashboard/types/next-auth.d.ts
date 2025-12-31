import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    backendToken: string;
    user: {
      githubId: string;
      id: string; // Add id to session user
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    backendToken: string;
    githubId: string;
    userId: string; // Add userId to JWT
  }
}
