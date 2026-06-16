import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    // 获取最近匹配度≥80的未通知岗位
    const matches = await prisma.matchRecord.findMany({
      where: { userId: user.id, score: { gte: 80 } },
      orderBy: { matchedAt: 'desc' },
      take: 20,
      include: { job: true },
    });

    return NextResponse.json({
      notifications: matches.map(m => ({
        id: m.id,
        type: 'match',
        jobId: m.job.id,
        score: m.score,
        jobTitle: m.job.title,
        companyName: m.job.companyName,
        city: m.job.city,
        salaryMin: m.job.salaryMin,
        salaryMax: m.job.salaryMax,
        matchedAt: m.matchedAt.toISOString(),
        read: false,
      })),
    });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
