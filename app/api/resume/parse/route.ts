import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { parseResume } from '@/services/resume/parser';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { resumeId } = await req.json().catch(() => ({}));

    let resume;
    if (resumeId) {
      resume = await prisma.resume.findUnique({
        where: { id: resumeId },
      });
      if (!resume || resume.userId !== user.id) {
        return NextResponse.json({ error: '简历不存在' }, { status: 404 });
      }
    } else {
      // 取最新的简历
      resume = await prisma.resume.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      if (!resume) {
        return NextResponse.json({ error: '请先上传简历' }, { status: 400 });
      }
    }

    // 标记解析中
    await prisma.resume.update({
      where: { id: resume.id },
      data: { parseStatus: 'parsing' },
    });

    try {
      const result = await parseResume(resume.filePath);

      await prisma.resume.update({
        where: { id: resume.id },
        data: { parseStatus: 'done' },
      });

      await prisma.jobSeekerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          skillTags: JSON.stringify(result.skillTags),
          workYears: result.workYears,
          educationJson: JSON.stringify(result.education),
        },
        update: {
          skillTags: JSON.stringify(result.skillTags),
          workYears: result.workYears,
          educationJson: JSON.stringify(result.education),
        },
      });

      return NextResponse.json({
        status: 'done',
        profile: {
          skillTags: result.skillTags,
          workYears: result.workYears,
          education: result.education,
        },
      });
    } catch (parseErr) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: { parseStatus: 'failed', parseError: String(parseErr) },
      });
      return NextResponse.json({
        status: 'failed',
        error: String(parseErr),
      }, { status: 200 });
    }
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
