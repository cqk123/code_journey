import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

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
  const fmt = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
    return n.toString();
  };
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
  '大厂': 'blue',
  '外企': 'green',
  '国企&央企': 'red',
  '创业公司': 'yellow',
  '中型企业': 'slate',
};

export function JobCard({ job }: JobCardProps) {
  const fresh = freshnessConfig[job.freshness] || freshnessConfig['30d'];

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white rounded-xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                {job.title}
              </h3>
              <Badge variant={fresh.color}>{fresh.label}</Badge>
            </div>
            <p className="text-sm text-slate-500">
              {job.companyName}
              {job.companyType && (
                <Tag color={companyTypeColors[job.companyType] || 'slate'} className="ml-2">
                  {job.companyType}
                </Tag>
              )}
              {job.city && <span className="ml-2">📍 {job.city}</span>}
            </p>
          </div>
          {job.matchScore !== null && (
            <div className={cn(
              'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold',
              job.matchScore >= 80 ? 'bg-green-100 text-green-700' :
              job.matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
              'bg-slate-100 text-slate-500'
            )}>
              {job.matchScore}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.techStack.slice(0, 5).map(skill => (
            <Tag key={skill} color="slate">{skill}</Tag>
          ))}
          {job.techStack.length > 5 && (
            <Tag color="slate">+{job.techStack.length - 5}</Tag>
          )}
          {job.jobDirection && (
            <Tag color="blue">{job.jobDirection}</Tag>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 text-sm">
          <span className={cn(
            'font-semibold',
            job.salaryMin ? 'text-red-600' : 'text-slate-400'
          )}>
            {formatSalary(job.salaryMin, job.salaryMax)}
            {job.salarySource === 'company_labeled' && (
              <span className="ml-1 text-xs text-green-600 font-normal">已认证</span>
            )}
          </span>
          <span className="text-slate-400 text-xs">{job.isSaved ? '⭐ 已收藏' : ''}</span>
        </div>
      </div>
    </Link>
  );
}
