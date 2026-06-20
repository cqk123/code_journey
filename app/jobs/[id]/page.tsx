import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

async function getBaseUrl() {
  try {
    const h = await headers();
    const host = h.get('host') || h.get('x-forwarded-host') || 'localhost:3000';
    const proto = h.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  } catch {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
}

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
