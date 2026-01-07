import { Skeleton } from "@/components/ui/skeleton";
import { PremiumCard, PremiumCardContent } from "@/components/ui/premium-card";

export function ProjectCardSkeleton() {
  return (
    <PremiumCard className="h-full">
      <PremiumCardContent className="p-8 flex flex-col justify-between h-full">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="w-16 h-6 rounded-full" />
          </div>

          <div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-white/[0.05] pt-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </PremiumCardContent>
    </PremiumCard>
  );
}

export function ActivityCardSkeleton() {
  return (
    <PremiumCard variant="subtle">
      <PremiumCardContent className="p-4 flex items-center gap-4">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </PremiumCardContent>
    </PremiumCard>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-10">
        <section className="space-y-6">
          <Skeleton className="h-4 w-32" />
          <PremiumCard variant="glass">
            <PremiumCardContent className="space-y-8 p-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
              <Skeleton className="h-12 w-full rounded-2xl" />
            </PremiumCardContent>
          </PremiumCard>
        </section>

        <section className="space-y-6">
          <Skeleton className="h-4 w-32" />
          <div className="space-y-4">
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
            <ActivityCardSkeleton />
          </div>
        </section>
      </aside>
    </div>
  );
}
