'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SavedPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, error, mutate } = useSWR('/api/saved', fetcher);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState(false);

  const jobs = data?.list || [];

  function toggle(jobId: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
  }

  async function removeSaved(jobId: string) {
    setRemoving(true);
    try {
      const res = await fetch(`/api/saved/${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('已取消收藏', 'info');
      mutate();
    } catch { toast('操作失败', 'error'); }
    finally { setRemoving(false); }
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center animate-in">
        <p className="text-slate-500 mb-4">需要登录才能查看收藏</p>
        <Button onClick={() => router.push('/auth/login')}>去登录</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的收藏</h1>
          <p className="text-slate-500 text-sm mt-1">已收藏 {jobs.length} 个岗位</p>
        </div>
        {selected.size >= 2 && (
          <Button onClick={() => { const ids = Array.from(selected); router.push(`/saved/compare?ids=${ids.join(',')}`); }}>
            对比已选（{selected.size}）
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <div className="text-5xl mb-4">⭐</div>
          <p className="text-slate-500 mb-4">还没有收藏的岗位</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/')}>去首页看看</Button>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {jobs.map((job: any) => (
            <div key={job.id} className={`glass-card p-4 flex items-center gap-4 ${job.status === 'closed' ? 'opacity-40' : ''}`}>
              <input
                type="checkbox"
                checked={selected.has(job.id)}
                onChange={() => toggle(job.id)}
                disabled={selected.size >= 5 && !selected.has(job.id)}
                className="w-4 h-4 accent-blue-600 flex-shrink-0 rounded"
              />
              <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{job.title}</div>
                <div className="text-sm text-slate-500 mt-0.5">{job.companyName} · {job.city}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {job.techStack?.slice(0, 4).map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">{s}</span>
                  ))}
                </div>
              </Link>
              <div className="flex items-center gap-3 flex-shrink-0">
                {job.status === 'closed' && <Badge variant="red">已关闭</Badge>}
                <span className="text-sm text-slate-400">{new Date(job.savedAt).toLocaleDateString('zh-CN')}</span>
                <Button variant="ghost" size="sm" loading={removing} onClick={() => removeSaved(job.id)}>取消</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
