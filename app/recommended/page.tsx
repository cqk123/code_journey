'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { JobCard } from '@/components/jobs/JobCard';
import { Button } from '@/components/ui/Button';
import { JobCardSkeleton } from '@/components/ui/Skeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RecommendedPage() {
  const router = useRouter();
  const { data, isLoading, error } = useSWR('/api/jobs?matched=true&pageSize=50', fetcher);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-in">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-slate-500 mb-4">需要登录才能查看推荐</p>
        <Button onClick={() => router.push('/auth/login')}>去登录</Button>
      </div>
    );
  }

  const jobs = data?.list || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">个性化推荐</h1>
          <p className="text-slate-500 text-sm mt-1">基于你的技能画像和求职意向，智能匹配的岗位</p>
        </div>
        <div className="flex items-center gap-2">
          {data && <span className="text-sm text-slate-400 mr-2">共 {data.total} 个匹配</span>}
          <Button size="sm" variant="outline" onClick={() => router.push('/profile')}>上传简历</Button>
          <Button size="sm" variant="outline" onClick={() => router.push('/profile/preferences')}>调整意向</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 stagger">
          {Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 glass-card animate-in">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">尚未匹配到岗位</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            请先上传简历并设置求职意向，系统将为你智能匹配最适合的岗位
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => router.push('/profile')}>上传简历</Button>
            <Button variant="outline" onClick={() => router.push('/profile/preferences')}>设置意向</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {jobs.map((job: any) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
