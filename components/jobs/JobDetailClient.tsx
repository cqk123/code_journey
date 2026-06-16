'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

// 复用 JobDetail 的展示部分（内联）
function formalizeSalary(min: number | null, max: number | null) {
  if (!min && !max) return '薪资面议';
  const fmt = (n: number) => (n / 1000).toFixed(0) + 'k';
  if (min && max) return `${fmt(min)}-${fmt(max)} / 月`;
  if (min) return `${fmt(min)}起 / 月`;
  return `最高${fmt(max!)} / 月`;
}

export default function JobDetailClient({ job }: { job: any }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(job.isSaved || false);
  const [saving, setSaving] = useState(false);

  const freshnessLabel: Record<string, string> = {
    today: '今日刷新', '7d': '本周刷新', '30d': '本月刷新', expired: '已过期',
  };

  async function toggleSave() {
    setSaving(true);
    try {
      if (saved) {
        // TODO: 实现取消收藏 API
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
    } catch {
      toast('操作失败', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* 标题区 */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
            {job.companyType && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {job.companyType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <span className="font-medium text-slate-700">{job.companyName}</span>
            {job.city && <span>📍 {job.city}</span>}
            <span>来源：{job.sourcePlatform || '企业官网'}</span>
          </div>
        </div>
        <Button
          variant={saved ? 'primary' : 'outline'}
          size="sm"
          onClick={toggleSave}
          loading={saving}
        >
          {saved ? '⭐ 已收藏' : '收藏'}
        </Button>
      </div>

      {/* 薪资 & 元信息 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
        <div>
          <div className="text-xs text-slate-400 mb-0.5">薪资</div>
          <div className="text-lg font-bold text-red-600">
            {formalizeSalary(job.salaryMin, job.salaryMax)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-0.5">岗位方向</div>
          <div className="text-sm font-medium text-blue-600">{job.jobDirection || '未分类'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 mb-0.5">刷新</div>
          <div className="text-sm text-slate-600">{freshnessLabel[job.freshness] || job.freshness}</div>
        </div>
        {job.matchInfo && (
          <div>
            <div className="text-xs text-slate-400 mb-0.5">匹配度</div>
            <div className={`text-lg font-bold ${job.matchInfo.score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
              {job.matchInfo.score}分
            </div>
          </div>
        )}
      </div>

      {/* 技术栈 */}
      {job.techStack && job.techStack.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase">技术栈要求</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.techStack.map((skill: string) => (
              <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 匹配详情（如有） */}
      {job.matchInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl">
          <h2 className="text-sm font-semibold text-green-700 mb-2">你的匹配情况</h2>
          <div className="text-sm">
            <span className="text-green-700">✅ 你匹配了：</span>
            <span className="text-slate-700"> {((job.matchInfo.matchedSkills || []) as string[]).join('、') || '—'}</span>
          </div>
          {job.matchInfo.missingSkills?.length > 0 && (
            <div className="text-sm mt-1">
              <span className="text-yellow-700">⚠️ 你还缺少：</span>
              <span className="text-slate-700"> {(job.matchInfo.missingSkills as string[]).join('、')}</span>
            </div>
          )}
        </div>
      )}

      {/* JD 正文 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase">岗位描述</h2>
        <div className="text-slate-700 whitespace-pre-line leading-relaxed">
          {job.jdFullText || '暂无详细描述'}
        </div>
      </div>

      {/* 来源链接 */}
      {job.sourceUrl && (
        <div className="text-sm text-slate-400">
          原始链接：
          <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
            {job.sourceUrl}
          </a>
        </div>
      )}
    </div>
  );
}
