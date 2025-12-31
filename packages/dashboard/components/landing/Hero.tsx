"use client";

import LaserFlow from "../ui/LaserFlow";
import { FadeIn } from "@/components/landing/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoiseBackground } from "@/components/ui/noise-background";
import {
  ArrowRight,
  Github,
  Terminal,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus } from "@/components/ui/plus";

export function Hero() {
  const { status } = useSession();
  const router = useRouter();
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-white/5">
      {/* Background Grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="absolute inset-0 pointer-events-none opacity-40">
        <LaserFlow
          horizontalBeamOffset={0.0}
          verticalBeamOffset={0.0}
          color="#3B82F6"
          fogIntensity={1}
          wispDensity={1.0}
          flowSpeed={0.2}
          verticalSizing={0.5}
          horizontalSizing={2}
          wispSpeed={15.0}
          wispIntensity={6.0}
          fogScale={0.3}
          mouseTiltStrength={0.1}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[900px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen opacity-50 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[900px] bg-purple-600/10 blur-[100px] rounded-full mix-blend-screen opacity-30" />
      </div>

      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
      <div className="absolute inset-y-0 left-0 w-px bg-white/5" />
      <div className="absolute inset-y-0 right-0 w-px bg-white/5" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />

      {/* Markers */}
      <Plus className="absolute -top-[5.5px] -left-[5.5px] z-10" />
      <Plus className="absolute -top-[5.5px] -right-[5.5px] z-10" />
      <Plus className="absolute -bottom-[5.5px] -left-[5.5px] z-10" />
      <Plus className="absolute -bottom-[5.5px] -right-[5.5px] z-10" />

      <div className="container relative z-10 px-4 mx-auto text-center">
        <FadeIn delay={0.1}>
          <Badge
            variant="outline"
            className="mb-8 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors px-4 py-1.5 text-sm backdrop-blur-sm"
          >
            Titan 2.0 is now available
          </Badge>
        </FadeIn>

        <FadeIn delay={0.2}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 pb-2">
            Deploy your <br className="hidden md:block" />
            frontend in seconds.
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The global platform for frontend developers. Connect your GitHub
            repository and let Deply handle the rest. Automatic builds, instant
            deployments, and edge scaling.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <NoiseBackground
              containerClassName="w-fit p-1 rounded-full"
              gradientColors={[
                "rgb(255, 100, 150)",
                "rgb(100, 150, 255)",
                "rgb(255, 200, 100)",
              ]}
            >
              <Link href={status === "authenticated" ? "/dashboard" : "/login"}>
                <Button className="h-10 rounded-full bg-black text-white px-6 font-medium border border-neutral-800 shadow-[0px_1px_0px_0px_var(--color-neutral-900)_inset] transition-all duration-300 active:scale-95 hover:bg-neutral-900">
                  {status === "authenticated"
                    ? "Go to Dashboard"
                    : "Start Deploying"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </NoiseBackground>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                if (status === "authenticated") {
                  router.push("/dashboard/new");
                } else {
                  signIn("github", { callbackUrl: "/dashboard" });
                }
              }}
              className="h-12 px-8 text-base border-gray-800 bg-black/50 hover:bg-gray-900 text-gray-300 hover:text-white rounded-full"
            >
              <Github className="mr-2 w-4 h-4" />
              {status === "authenticated"
                ? "Create New Project"
                : "Import from GitHub"}
            </Button>
          </div>
        </FadeIn>
        <FadeIn delay={0.5} className="relative max-w-3xl mx-auto">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl overflow-hidden group"
          >
            {/* Gloss reflection overlay */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[0_0_10px_rgba(255,95,86,0.3)]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.3)]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[0_0_10px_rgba(39,201,63,0.3)]" />
              </div>
              <div className="text-xs text-gray-500 ml-4 font-mono flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                titan-cli — zsh
              </div>
            </div>

            <div className="p-6 text-left font-mono text-sm relative h-[320px] sm:h-[280px]">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center">
                  <span className="text-blue-400 mr-2">➜</span>
                  <span className="text-cyan-300 mr-2">~/project</span>
                  <span className="text-gray-400">titan deploy</span>
                </div>

                <div className="space-y-2 py-2">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 }}
                    className="flex items-center text-gray-300"
                  >
                    <Loader2 className="w-4 h-4 mr-2 text-blue-500 animate-spin" />
                    Building application...{" "}
                    <span className="ml-2 text-xs text-gray-500">[241ms]</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 }}
                    className="flex items-center text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    Optimizing static assets
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 3.2 }}
                    className="flex items-center text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    Edge functions compiled
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 4.0 }}
                    className="flex items-center text-gray-300"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                    Uploaded to global edge network
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.5 }}
                  className="mt-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-400 fill-green-400" />
                    </div>
                    <div>
                      <div className="text-xs text-green-400 font-bold uppercase tracking-wider">
                        Deployment Complete
                      </div>
                      <div className="text-white text-sm">
                        project-gamma.deply.app
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/20"
                  >
                    Visit
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}
