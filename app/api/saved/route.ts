import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();

    const saved = await prisma.savedJob.findMany({
      where: { userId: user.id },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      list: saved.map(s => ({
        id: s.job.id,
        title: s.job.title,
        companyName: s.job.companyName,
        city: s.job.city,
        salaryMin: s.job.salaryMin,
        salaryMax: s.job.salaryMax,
        jobDirection: s.job.jobDirection,
        techStack: JSON.parse(s.job.techStack || '[]'),
        status: s.job.status,
        savedAt: s.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: '缺少 jobId' }, { status: 400 });
    }

    await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId } },
      create: { userId: user.id, jobId },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
