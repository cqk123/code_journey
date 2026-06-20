import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/base-url';

async function getJob(id: string) {
  const baseUrl = await getBaseUrl();
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

  const { default: JobDetailClient } = await import('@/components/jobs/JobDetailClient');
  return <JobDetailClient job={job} />;
}
