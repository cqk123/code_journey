import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ matched: [] });
    }

    const { searchParams } = new URL(req.url);
    const minScore = parseInt(searchParams.get('minScore') || '60');
    const limit = parseInt(searchParams.get('limit') || '20');

    const matches = await prisma.matchRecord.findMany({
      where: { userId: user.id, score: { gte: minScore } },
      orderBy: { score: 'desc' },
      take: limit,
      include: { job: true },
    });

    return NextResponse.json({
      matched: matches.map(m => ({
        matchId: m.id,
        score: m.score,
        matchedSkills: JSON.parse(m.matchedSkills || '[]'),
        missingSkills: JSON.parse(m.missingSkills || '[]'),
        matchedAt: m.matchedAt.toISOString(),
        job: {
          id: m.job.id,
          title: m.job.title,
          companyName: m.job.companyName,
          companyType: m.job.companyType,
          city: m.job.city,
          salaryMin: m.job.salaryMin,
          salaryMax: m.job.salaryMax,
          jobDirection: m.job.jobDirection,
          techStack: JSON.parse(m.job.techStack || '[]'),
        },
      })),
    });
  } catch (err) {
    console.error('match api error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
