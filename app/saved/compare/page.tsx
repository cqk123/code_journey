'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function CompareContent() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = params.get('ids')?.split(',').filter(Boolean) || [];

  const { data, isLoading } = useSWR(
    ids.length > 0 ? `/api/jobs?pageSize=50` : null,
    fetcher
  );

  const allJobs = data?.list || [];
  const jobs = allJobs.filter((j: any) => ids.includes(j.id));

  if (ids.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-slate-500">请先在收藏页勾选岗位进行对比</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/saved')}>返回收藏</Button>
      </div>
    );
  }

  const dimensions = [
    { key: 'companyName', label: '公司' },
    { key: 'city', label: '城市' },
    { key: 'companyType', label: '单位类型' },
    { key: 'salary', label: '薪资', format: (j: any) => j.salaryMin ? `${(j.salaryMin/1000).toFixed(0)}k-${(j.salaryMax/1000).toFixed(0)}k` : '面议' },
    { key: 'techStack', label: '技术栈', format: (j: any) => j.techStack?.slice(0, 6).join('、') || '—' },
    { key: 'jobDirection', label: '方向' },
    { key: 'matchScore', label: '匹配度', format: (j: any) => j.matchScore ? `${j.matchScore}分` : '—' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">岗位对比</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push('/saved')}>← 返回收藏</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-24">维度</th>
                {jobs.map((j: any, i: number) => (
                  <th key={j.id} className="text-left px-4 py-3 font-medium">
                    <button onClick={() => router.push(`/jobs/${j.id}`)} className="text-blue-600 hover:underline">
                      岗位{i + 1}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dimensions.map(dim => (
                <tr key={dim.key} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-slate-500 font-medium bg-slate-50">{dim.label}</td>
                  {jobs.map((j: any) => (
                    <td key={j.id} className="px-4 py-3 text-slate-700">
                      {dim.format ? dim.format(j) : (j[dim.key] || '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-400">加载中...</div>}>
      <CompareContent />
    </Suspense>
  );
}
