import { notFound } from 'next/navigation';

async function getJob(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/jobs/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  // 内联展示（Server Component 中不能 import client component）
  // 改用动态渲染
  const { default: JobDetailClient } = await import('@/components/jobs/JobDetailClient');
  return <JobDetailClient job={job} />;
}
