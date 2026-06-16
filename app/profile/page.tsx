import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await getUser().catch(() => null);
  if (!user) redirect('/auth/login?redirect=/profile');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">个人画像</h1>
      <div className="grid gap-4">
        <Link href="/profile/resume" className="block p-5 bg-white rounded-xl border hover:border-blue-300 transition-colors">
          <div className="font-medium text-slate-800">简历管理</div>
          <div className="text-sm text-slate-500 mt-1">上传简历，自动提取技术栈和工作经历</div>
        </Link>
        <Link href="/profile/preferences" className="block p-5 bg-white rounded-xl border hover:border-blue-300 transition-colors">
          <div className="font-medium text-slate-800">求职意向</div>
          <div className="text-sm text-slate-500 mt-1">设置期望城市、薪资、岗位类型</div>
        </Link>
      </div>
    </div>
  );
}
