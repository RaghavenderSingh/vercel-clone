"use client";

import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export function UserConfig() {
  const { data: session } = useSession();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-black tracking-tighter mb-2">My Profile</h2>
        <p className="text-muted-foreground font-bold">Manage your personal information.</p>
      </div>

      <div className="rounded-[2rem] border border-border bg-card/40 p-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="space-y-4">
                <div className="w-24 h-24 rounded-full border-4 border-border/50 overflow-hidden relative group">
                    <Avatar className="w-full h-full">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="text-2xl font-black bg-muted">
                            {session?.user?.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <Button variant="outline" size="sm" className="w-full font-bold rounded-xl">Change Avatar</Button>
            </div>
            
            <div className="flex-1 space-y-6 w-full max-w-lg">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Display Name</label>
                    <Input 
                        defaultValue={session?.user?.name || ""}
                        className="h-12 bg-muted/20 border-border/40 rounded-xl font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                    <Input 
                        defaultValue={session?.user?.email || ""}
                        disabled
                        className="h-12 bg-muted/10 border-border/20 rounded-xl font-medium text-muted-foreground"
                    />
                </div>
                <div className="pt-4 flex justify-end">
                    <Button className="rounded-xl px-8 h-10 font-black">
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
