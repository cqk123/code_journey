import { Badge } from '@/components/ui/Badge';
import { JobFeedShell } from '@/components/jobs/JobFeedShell';

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 欢迎横幅 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-1">发现你的下一份计算机工作</h1>
        <p className="text-blue-100 text-sm">
          全网计算机岗位一站聚合 · 简历智能匹配 · 多维组合筛选
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="slate" className="bg-white/20 text-white border-white/20">
            后端 · 前端 · AI · 数据 · 全栈
          </Badge>
          <Badge variant="slate" className="bg-white/20 text-white border-white/20">
            北京 · 上海 · 深圳 · 杭州 · 成都
          </Badge>
        </div>
      </div>

      {/* 岗位 Feed + 筛选面板 */}
      <JobFeedShell />
    </div>
  );
}
