'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NotificationsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useSWR('/api/notifications', fetcher);
  const notifications = data?.notifications || [];

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-in">
        <p className="text-slate-500 mb-4">需要登录</p>
        <Button onClick={() => router.push('/auth/login')} size="sm">去登录</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">通知中心</h1>
      <p className="text-slate-500 text-sm mb-8">新匹配岗位和系统通知</p>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-500">暂无新通知</p>
          <p className="text-slate-400 text-sm mt-1">当有高匹配度岗位时，会在这里通知你</p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {notifications.map((n: any) => (
            <Link key={n.id} href={`/jobs/${n.jobId || ''}`} className="block glass-card p-4 group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">🎯</span>
                    <span className="font-medium text-blue-700">新匹配岗位</span>
                    <Badge variant={n.score >= 80 ? 'green' : 'yellow'}>{n.score}分</Badge>
                  </div>
                  <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{n.jobTitle}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {n.companyName} · {n.city} · {n.salaryMin ? `${(n.salaryMin / 1000).toFixed(0)}k` : '薪资面议'}
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 ml-4">
                  {new Date(n.matchedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
