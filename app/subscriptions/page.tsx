'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SubscriptionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, error, mutate } = useSWR('/api/filters', fetcher);

  const presets = data?.presets || [];

  async function removePreset(id: string) {
    try {
      const res = await fetch(`/api/filters/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast('已删除', 'info');
      mutate();
    } catch { toast('删除失败', 'error'); }
  }

  function loadPreset(filters: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters.time && filters.time !== 'all') params.set('time', filters.time);
    if (filters.cities?.length > 0) params.set('cities', filters.cities.join(','));
    if (filters.orgTypes?.length > 0) params.set('orgTypes', filters.orgTypes.join(','));
    if (filters.directions?.length > 0) params.set('directions', filters.directions.join(','));
    if (filters.salaryMin > 0) params.set('salaryMin', String(filters.salaryMin));
    router.push('/?' + params.toString());
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500 mb-2">需要登录</p>
        <Button onClick={() => router.push('/auth/login')} size="sm">去登录</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">我的订阅</h1>
          <p className="text-slate-500 text-sm mt-1">保存的筛选条件，一键加载</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/')}>去首页创建</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">加载中...</div>
      ) : presets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <div className="text-5xl mb-3">🏷️</div>
          <p className="text-slate-500">还没有保存的筛选条件</p>
          <p className="text-slate-400 text-sm mt-1">在首页设置筛选条件后，点击"保存筛选"即可</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/')}>去首页筛选</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {presets.map((p: any) => {
            const f = p.filters;
            const summary: string[] = [];
            if (f.cities?.length > 0) summary.push(f.cities.join('、'));
            if (f.directions?.length > 0) summary.push(f.directions.join('、'));
            if (f.orgTypes?.length > 0) summary.push(f.orgTypes.join('、'));
            if (f.salaryMin > 0) summary.push((f.salaryMin / 1000).toFixed(0) + 'k+');
            return (
              <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {summary.length > 0 ? summary.join(' · ') : '无筛选条件'}
                    <span className="ml-2">创建于 {new Date(p.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <Button size="sm" variant="outline" onClick={() => loadPreset(f)}>加载</Button>
                  <Button size="sm" variant="ghost" onClick={() => removePreset(p.id)}>删除</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
