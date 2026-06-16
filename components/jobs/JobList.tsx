'use client';

import { JobCard } from '@/components/jobs/JobCard';
import { JobCardSkeleton } from '@/components/ui/Skeleton';

interface JobListProps {
  jobs: JobCardData[];
  loading?: boolean;
}

type JobCardData = React.ComponentProps<typeof JobCard>['job'];

export function JobList({ jobs, loading }: JobListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">🔍</div>
        <p className="text-slate-500 text-lg">没有找到匹配的岗位</p>
        <p className="text-slate-400 text-sm mt-1">试试放宽筛选条件</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
