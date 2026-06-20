import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn(
      'animate-pulse rounded-lg bg-gradient-to-r from-slate-100 via-slate-200/70 to-slate-100 bg-[length:200%_100%]',
      'animate-[shimmer_1.5s_ease-in-out_infinite]',
      className
    )} />
  );
}

export function JobCardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-3 opacity-60">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-14 rounded-md" />
      </div>
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
