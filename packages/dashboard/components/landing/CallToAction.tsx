"use client";

import { FadeIn } from "@/components/landing/FadeIn";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

export function CallToAction() {
  const { status } = useSession();
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <FadeIn direction="up">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-8 md:p-24 text-center shadow-2xl group"
          >
      
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        
            <div className="absolute top-4 left-4 right-4 h-32 bg-gradient-to-b from-white/[0.05] to-transparent rounded-full opacity-50 pointer-events-none" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Ready to deploy?
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Import your GitHub repository and get your project online in
                minutes. Free to start, with automated builds and deployments.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href={status === "authenticated" ? "/dashboard" : "/login"}>
                  <Button
                    size="lg"
                    className="h-14 px-10 text-lg bg-white text-black hover:bg-white/90 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                  >
                    {status === "authenticated" ? "Go to Dashboard" : "Start for Free"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}
