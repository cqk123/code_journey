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
      freshness: job.freshness,
      status: job.status,
      matchInfo,
      isSaved,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('job detail error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
