import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUser().catch(() => null);

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: '岗位不存在' }, { status: 404 });
    }

    let matchInfo = null;
    let isSaved = false;

    if (user) {
      const [match, saved] = await Promise.all([
        prisma.matchRecord.findUnique({
          where: { userId_jobId: { userId: user.id, jobId: id } },
        }),
        prisma.savedJob.findUnique({
          where: { userId_jobId: { userId: user.id, jobId: id } },
        }),
      ]);
      if (match) {
        matchInfo = {
          score: match.score,
          matchedSkills: JSON.parse(match.matchedSkills || '[]'),
          missingSkills: JSON.parse(match.missingSkills || '[]'),
        };
      }
      isSaved = !!saved;
    }

    const now = Date.now();
    const refreshed = job.lastRefreshedAt?.getTime() || 0;
    let freshness = 'expired';
    if (now - refreshed < 24 * 60 * 60 * 1000) freshness = 'today';
    else if (now - refreshed < 7 * 24 * 60 * 60 * 1000) freshness = '7d';
    else if (now - refreshed < 30 * 24 * 60 * 60 * 1000) freshness = '30d';

    return NextResponse.json({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      companyType: job.companyType,
      city: job.city,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salarySource: job.salarySource,
      jobDirection: job.jobDirection,
      techStack: JSON.parse(job.techStack || '[]'),
      jdFullText: job.jdFullText,
      sourceUrl: job.sourceUrl,
      sourcePlatform: job.sourcePlatform,
      publishedAt: job.publishedAt?.toISOString() || null,
      lastRefreshedAt: job.lastRefreshedAt?.toISOString() || null,
      freshness,
      status: job.status,
      matchInfo,
      isSaved,
    });
  } catch (err) {
    console.error('job detail error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
