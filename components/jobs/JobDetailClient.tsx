'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export default function JobDetailClient({ job }: { job: any }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(job.isSaved || false);
  const [saving, setSaving] = useState(false);

  const freshnessLabel: Record<string, string> = {
    today: '今日刷新', '7d': '本周刷新', '30d': '本月刷新', expired: '已过期',
  };

  function formatSalary(min: number | null, max: number | null) {
    if (!min && !max) return '薪资面议';
    const fmt = (n: number) => (n / 1000).toFixed(0) + 'k';
    if (min && max) return `${fmt(min)}-${fmt(max)} / 月`;
    if (min) return `${fmt(min)}起 / 月`;
    return `最高${fmt(max!)} / 月`;
  }

  async function toggleSave() {
    setSaving(true);
    try {
      if (saved) {
        setSaved(false);
        toast('已取消收藏', 'info');
      } else {
        const res = await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: job.id }),
        });
        if (!res.ok) throw new Error();
        setSaved(true);
        toast('已收藏', 'success');
      }
    } catch { toast('操作失败', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {job.freshness === 'today' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/50">今日刷新</span>
            )}
            {job.companyType && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200/50">{job.companyType}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{job.title}</h1>
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <span className="font-semibold text-slate-700">{job.companyName}</span>
            {job.city && <span>· {job.city}</span>}
            <span className="text-slate-400">· {job.sourcePlatform}</span>
          </div>
        </div>
        <Button variant={saved ? 'primary' : 'outline'} size="md" onClick={toggleSave} loading={saving}>
          {saved ? '⭐ 已收藏' : '收藏'}
        </Button>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="glass-card p-4 text-center">
          <div className="text-xs text-slate-400 mb-0.5">薪资</div>
          <div className="text-base font-bold text-rose-600">{formatSalary(job.salaryMin, job.salaryMax)}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-xs text-slate-400 mb-0.5">方向</div>
          <div className="text-sm font-semibold text-blue-600">{job.jobDirection || '未分类'}</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-xs text-slate-400 mb-0.5">刷新</div>
          <div className="text-sm text-slate-600">{freshnessLabel[job.freshness] || job.freshness}</div>
        </div>
        {job.matchInfo && (
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-slate-400 mb-0.5">匹配度</div>
            <div className={`text-base font-bold ${job.matchInfo.score >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {job.matchInfo.score} 分
            </div>
          </div>
        )}
      </div>

      {/* Tech Stack */}
      {job.techStack?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">技术栈</h2>
          <div className="flex flex-wrap gap-2">
            {job.techStack.map((skill: string) => (
              <span key={skill} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium border border-blue-100/50">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Match info */}
      {job.matchInfo && (
        <>
          <div className="mb-8 p-5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
            <h2 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              你的匹配情况
            </h2>
            <div className="text-sm space-y-1.5">
              <div>
                <span className="text-emerald-600 font-medium">✅ 已匹配：</span>
                <span className="text-slate-700"> {(job.matchInfo.matchedSkills as string[] || []).join('、') || '—'}</span>
              </div>
              {job.matchInfo.missingSkills?.length > 0 && (
                <div>
                  <span className="text-amber-600 font-medium">⚠️ 待提升：</span>
                  <span className="text-slate-700"> {(job.matchInfo.missingSkills as string[]).join('、')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Matched + Missing skills comparison */}
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400 mb-2">✅ 已匹配技能</div>
              <div className="flex flex-wrap gap-1.5">
                {(job.matchInfo.matchedSkills as string[] || []).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-md">{s}</span>
                ))}
                {(!job.matchInfo.matchedSkills?.length) && <span className="text-slate-400 text-xs">—</span>}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100">
              <div className="text-xs text-slate-400 mb-2">⚠️ 待提升技能</div>
              <div className="flex flex-wrap gap-1.5">
                {(job.matchInfo.missingSkills as string[] || []).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-md">{s}</span>
                ))}
                {(!job.matchInfo.missingSkills?.length) && (
                  <span className="text-emerald-600 text-xs">🎉 全部匹配!</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* JD */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">岗位描述</h2>
        <div className="text-slate-700 whitespace-pre-line leading-relaxed text-[15px] bg-white rounded-xl border border-slate-100 p-6">
          {job.jdFullText || '暂无详细描述'}
        </div>
      </div>

      {/* Source */}
      {job.sourceUrl && (
        <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors">
          <span>查看原始链接</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      )}
    </div>
  );
}
