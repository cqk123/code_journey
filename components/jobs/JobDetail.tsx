import { User, Prisma } from '@prisma/client';

/**
 * 岗位详情页的通用信息展示组件（不涉及用户数据）
 */
function JobInfo({ job }: { job: any }) {
  const salarySourceLabel: Record<string, string> = {
    company_labeled: '企业标注',
    system_inferred: '系统推断',
  };

  const formalizeSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return '薪资面议';
    const fmt = (n: number) => (n / 1000).toFixed(0) + 'k';
    if (min && max) return `${fmt(min)}-${fmt(max)} / 月`;
    if (min) return `${fmt(min)}起 / 月`;
    return `最高${fmt(max!)} / 月`;
  };

  const freshnessLabel: Record<string, string> = {
    today: '今日刷新',
    '7d': '本周刷新',
    '30d': '本月刷新',
    expired: '已过期',
  };

  const companyTypeMap: Record<string, string> = {
    '大厂': 'bg-blue-50 text-blue-700',
    '外企': 'bg-green-50 text-green-700',
    '国企&央企': 'bg-red-50 text-red-700',
    '创业公司': 'bg-yellow-50 text-yellow-700',
    '中型企业': 'bg-slate-100 text-slate-600',
  };

  return (
    <>
      {/* 标题区 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${companyTypeMap[job.companyType] || 'bg-slate-100 text-slate-600'}`}>
            {job.companyType || '未分类'}
          </span>
          {job.freshness && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              {freshnessLabel[job.freshness] || job.freshness}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <span className="font-medium text-slate-700">{job.companyName}</span>
          {job.city && <span>📍 {job.city}</span>}
          <span>来源：{job.sourcePlatform || '企业官网'}</span>
        </div>
      </div>

      {/* 薪资 & 技术栈 */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
        <div>
          <div className="text-xs text-slate-400 mb-0.5">薪资</div>
          <div className="text-xl font-bold text-red-600">
            {formalizeSalary(job.salaryMin, job.salaryMax)}
          </div>
          {job.salarySource && (
            <div className="text-xs text-slate-400 mt-0.5">
              🏷️ {salarySourceLabel[job.salarySource] || job.salarySource}
            </div>
          )}
        </div>
        {job.jobDirection && (
          <div className="border-l pl-4">
            <div className="text-xs text-slate-400 mb-0.5">岗位方向</div>
            <div className="text-sm font-medium text-blue-600">{job.jobDirection}</div>
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

      {/* JD 正文 */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-2 uppercase">岗位描述</h2>
        <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line leading-relaxed">
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
    </>
  );
}

export default JobInfo;
