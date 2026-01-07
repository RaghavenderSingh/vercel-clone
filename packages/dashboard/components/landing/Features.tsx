"use client";

import { FadeIn } from "@/components/landing/FadeIn";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { GitBranch, Globe, Shield, Terminal, Zap, Cpu } from "lucide-react";
import { Plus } from "../ui/plus";
import { motion } from "framer-motion";

export function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden border-y border-white/5">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} 
      />

      

      <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
      <div className="absolute inset-y-0 left-0 w-px bg-white/5" />
      <div className="absolute inset-y-0 right-0 w-px bg-white/5" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />


      <Plus className="absolute -top-[5.5px] -left-[5.5px] z-10" />
      <Plus className="absolute -top-[5.5px] -right-[5.5px] z-10" />
      <Plus className="absolute -bottom-[5.5px] -left-[5.5px] z-10" />
      <Plus className="absolute -bottom-[5.5px] -right-[5.5px] z-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Development simplified.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We've abstracted the complexity so you can focus on shipping products.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:auto-rows-[280px]">
          
          <FadeIn delay={0.1} className="md:col-span-4 md:row-span-1 h-full">
            <FeatureCard
              title="Instant Rollbacks"
              description="Made a mistake? Roll back to any previous deployment version in a single click. Our infrastructure keeps every version of your site ready to go, ensuring you can revert in seconds."
              icon={<GitBranch className="w-8 h-8" />}
              showMarkers
            />
          </FadeIn>

          <FadeIn delay={0.2} className="md:col-span-2 md:row-span-1 h-full">
            <FeatureCard
              title="Security"
              description="Enterprise-grade DDoS protection and encryption baked into every layer."
              icon={<Shield className="w-6 h-6" />}
            />
          </FadeIn>


          <FadeIn delay={0.3} className="md:col-span-4 md:row-span-1 h-full">
            <FeatureCard
              title="Framework Support"
              description="Optimized for modern frameworks including Next.js, React, and more. Fully integrated with App Router and Server Components for seamless deployment."
              icon={<Cpu className="w-6 h-6" />}
              className="flex-row items-center gap-8"
              showMarkers
            />
          </FadeIn>

          <FadeIn delay={0.4} className="md:col-span-2 md:row-span-1 h-full">
            <FeatureCard
              title="Smart Caching"
              description="Intelligent caching and content delivery to ensure fast load times for your applications."
              icon={<Globe className="w-6 h-6" />}
            />
          </FadeIn>

          <FadeIn delay={0.5} className="md:col-span-3 md:row-span-1 h-full">
            <FeatureCard
              title="Analytics & Logs"
              description="Real-time traffic data and comprehensive logs to help you understand your application performance better."
              icon={<Zap className="w-6 h-6" />}
            />
          </FadeIn>

          <FadeIn delay={0.6} className="md:col-span-3 md:row-span-1 h-full">
            <FeatureCard
              title="Serverless Functions"
              description="Write backend code without managing servers. API routes are built right in, scaling automatically from zero to millions of requests."
              icon={<Terminal className="w-6 h-6" />}
              showMarkers
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
