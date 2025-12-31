"use client";

import { useState } from "react";
import { Plus, Trash, Copy, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function TokenManagement() {
  const [tokens, setTokens] = useState([
    { id: "1", name: "CLI Access", prefix: "tit_cli_", lastUsed: "2 mins ago", created: "2024-01-01" },
    { id: "2", name: "CI/CD Pipeline", prefix: "tit_ci_", lastUsed: "5 days ago", created: "2023-12-15" },
  ]);

  const [newTokenName, setNewTokenName] = useState("");

  const handleCreate = () => {
    if (!newTokenName) return;
    toast.success("Token created successfully");
    setTokens([...tokens, { 
        id: Date.now().toString(), 
        name: newTokenName, 
        prefix: "tit_custom_", 
        lastUsed: "Never", 
        created: new Date().toISOString().split('T')[0] 
    }]);
    setNewTokenName("");
  };

  const copyToken = () => {
    navigator.clipboard.writeText("tit_cli_xxxxxxxxxxxxxxxx");
    toast.success("Token copied to clipboard");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-6 pt-10 border-t border-border"
    >
      <div>
        <h2 className="text-2xl font-black tracking-tighter mb-2">Access Tokens</h2>
        <p className="text-muted-foreground font-bold">Manage tokens for CLI access and external integrations.</p>
      </div>

      <div className="rounded-[2rem] border border-border bg-card/40 p-8 space-y-8">
        {/* Create Token */}
        <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Token Name</label>
                <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="e.g. MacBook Pro CLI" 
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        className="h-12 pl-12 bg-muted/20 border-border/40 rounded-xl font-medium"
                    />
                </div>
            </div>
            <Button 
                onClick={handleCreate}
                disabled={!newTokenName}
                className="h-12 px-6 rounded-xl font-black"
            >
                <Plus className="h-4 w-4 mr-2" />
                Create Token
            </Button>
        </div>

        {/* Token List */}
        <div className="space-y-3">
            {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/10 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Key className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">{token.name}</h4>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{token.prefix}••••••••••••</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Last Used</p>
                            <p className="text-xs font-medium">{token.lastUsed}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background border border-transparent hover:border-border" onClick={copyToken}>
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20">
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
