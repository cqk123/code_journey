import { Badge } from '@/components/ui/Badge';
import { JobFeedShell } from '@/components/jobs/JobFeedShell';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-10 mb-8 animate-in">
        {/* ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl translate-y-1/2" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white/80 text-xs mb-4 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            实时更新
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            发现你的下一份<br className="sm:hidden" />计算机工作
          </h1>
          <p className="text-blue-200/80 text-sm md:text-base max-w-lg">
            全网计算机岗位一站聚合 · 简历智能匹配 · 多维组合筛选
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['后端', '前端', 'AI', '数据', '全栈'].map(s => (
              <span key={s} className="px-2.5 py-1 rounded-md bg-white/10 text-white/70 text-xs font-medium border border-white/10 hover:bg-white/20 transition-colors">
                {s}
              </span>
            ))}
            <span className="text-white/30 text-xs flex items-center px-1">+ 更多方向</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {['北京', '上海', '深圳', '杭州', '成都'].map(c => (
              <span key={c} className="px-2.5 py-1 rounded-md bg-white/5 text-white/60 text-xs font-medium border border-white/5">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <JobFeedShell />
    </div>
  );
}
