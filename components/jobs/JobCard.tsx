import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    companyName: string;
    companyType: string | null;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salarySource: string | null;
    jobDirection: string | null;
    techStack: string[];
    freshness: string;
    matchScore: number | null;
    isSaved: boolean;
  };
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return '薪资面议';
  const fmt = (n: number) => (n >= 1000 ? (n / 1000).toFixed(0) + 'k' : n.toString());
  if (min && max) return `${fmt(min)}-${fmt(max)}`;
  if (min) return `${fmt(min)}起`;
  return `最高${fmt(max!)}`;
}

const freshnessConfig: Record<string, { label: string; color: 'green' | 'yellow' | 'red' | 'slate' }> = {
  today: { label: '今日', color: 'green' },
  '7d': { label: '本周', color: 'slate' },
  '30d': { label: '本月', color: 'slate' },
  expired: { label: '过期', color: 'red' },
};

const companyTypeColors: Record<string, 'blue' | 'green' | 'red' | 'yellow' | 'slate'> = {
  '大厂': 'blue', '外企': 'green', '国企&央企': 'red', '创业公司': 'yellow', '中型企业': 'slate',
};

export const JobCard = React.memo(function JobCard({ job }: JobCardProps) {
  const fresh = freshnessConfig[job.freshness] || freshnessConfig['30d'];

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="glass-card p-5 cursor-pointer group relative overflow-hidden">
        {/* subtle hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/[0.02] to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors duration-200 truncate text-[15px]">
                {job.title}
              </h3>
              {fresh.label !== '本月' && (
                <Badge variant={fresh.color}>{fresh.label}</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-slate-700">{job.companyName}</span>
              {job.companyType && (
                <Tag color={companyTypeColors[job.companyType] || 'slate'}>{job.companyType}</Tag>
              )}
              {job.city && <span className="text-slate-400">· {job.city}</span>}
            </p>
          </div>
          {job.matchScore !== null && (
            <div className={cn(
              'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300',
              job.matchScore >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' :
              job.matchScore >= 60 ? 'bg-amber-50 text-amber-600 border border-amber-200/50' :
              'bg-slate-100 text-slate-400 border border-slate-200/50'
            )}>
              {job.matchScore}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.techStack.slice(0, 5).map(skill => (
            <Tag key={skill} color="slate">{skill}</Tag>
          ))}
          {job.techStack.length > 5 && <Tag color="slate">+{job.techStack.length - 5}</Tag>}
          {job.jobDirection && <Tag color="blue">{job.jobDirection}</Tag>}
        </div>

        <div className="flex items-center justify-between mt-3 text-sm">
          <span className={cn('font-semibold', job.salaryMin ? 'text-rose-600' : 'text-slate-400')}>
            {formatSalary(job.salaryMin, job.salaryMax)}
            {job.salarySource === 'company_labeled' && (
              <span className="ml-1.5 text-xs text-emerald-600 font-normal">✓ 已认证</span>
            )}
          </span>
          {job.isSaved && <span className="text-amber-500 text-xs">⭐ 已收藏</span>}
        </div>
      </div>
    </Link>
  );
});
