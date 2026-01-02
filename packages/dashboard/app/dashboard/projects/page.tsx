"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { projectsAPI } from "@/lib/api";
import Link from "next/link";
import { 
  Plus, 
  Github, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  GitBranch,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  repoUrl: string;
  framework: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.repoUrl.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  const fetchProjects = async () => {
    try {
      const { data } = await projectsAPI.list();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <main className="container mx-auto px-4 md:px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl border border-white/5" />
                ))}
            </div>
        </main>
    );
  }

  return (
    <main className="container mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link href="/dashboard/new">
          <Button className="font-medium bg-white text-black hover:bg-white/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 bg-black/50 border-white/10 focus:border-white/20 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex gap-2">
            <Select defaultValue="all">
                <SelectTrigger className="w-[140px] bg-black/50 border-white/10">
                    <SelectValue placeholder="All Frameworks" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Frameworks</SelectItem>
                    <SelectItem value="nextjs">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                </SelectContent>
            </Select>
            <div className="h-10 w-px bg-white/10 mx-1 hidden md:block" />
            <div className="flex items-center bg-white/5 rounded-md border border-white/10 p-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-sm ${viewMode === "grid" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}
                    onClick={() => setViewMode("grid")}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-8 w-8 rounded-sm ${viewMode === "list" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"}`}
                    onClick={() => setViewMode("list")}
                >
                    <ListIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-6">Try adjusting your search or filters.</p>
            <Button variant="outline" onClick={() => setSearchQuery("")} className="border-white/10 hover:bg-white/5">
                Clear Search
            </Button>
        </div>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-3"}>
          {filteredProjects.map((project) => (
            viewMode === "grid" ? (
              // Grid Card
              <Link 
                key={project.id} 
                href={`/dashboard/projects/${project.id}`}
                className="group flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 hover:border-white/20 transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-white">
                                {project.name[0].toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
                                    {project.name}
                                </h3>
                                <p className="text-xs text-muted-foreground">{project.framework || 'Next.js'}</p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 text-white/70">
                            <ArrowUpRight className="w-4 h-4" />
                        </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mb-2">
                        <p className="truncate max-w-[200px] hover:underline cursor-pointer flex items-center gap-1.5">
                            {project.name.toLowerCase()}.deply.app
                        </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <Github className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{project.repoUrl.replace('https://github.com/', '')}</span>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Ready</span>
                    </div>
                    <span>{formatDistanceToNow(new Date(project.createdAt))} ago</span>
                </div>
              </Link>
            ) : (
             // List Item
             <Link 
                key={project.id} 
                href={`/dashboard/projects/${project.id}`}
                className="group flex items-center justify-between p-4 rounded-lg border border-white/5 bg-black/40 hover:border-white/10 hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-medium text-white">
                            {project.name[0].toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                                    {project.framework || 'Next.js'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                    <GitBranch className="w-3 h-3" />
                                    main
                                </span>
                                <span>•</span>
                                <span>Updated {formatDistanceToNow(new Date(project.updatedAt || project.createdAt))} ago</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                         <div className="hidden md:flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs text-white/70">Ready</span>
                            </div>
                         </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-white">
                            <ArrowUpRight className="w-4 h-4" />
                        </Button>
                    </div>
                </Link>
            )
          ))}
        </div>
      )}
    </main>
  );
}
