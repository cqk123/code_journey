import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { uploadResumeBlob } from '@/lib/blob';
import { mkdir } from 'fs/promises';
import path from 'path';
import { getBaseUrl } from '@/lib/base-url';

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 大小限制
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    // 格式校验
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '请上传PDF或Word格式文件' }, { status: 400 });
    }

    // 本地开发：确保 uploads 目录存在
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', user.id);
    await mkdir(uploadsDir, { recursive: true }).catch(() => {});

    // 上传到 Blob（或本地）
    const filePath = await uploadResumeBlob(file, user.id);

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        filePath,
        parseStatus: 'pending',
      },
    });

    // 自动触发解析
    try {
      const { parseResume } = await import('@/services/resume/parser');
      const result = await parseResume(filePath);

      await prisma.resume.update({
        where: { id: resume.id },
        data: { parseStatus: 'done', parsedText: file.name },
      });

      // 更新或创建技能画像
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

      // 触发匹配
      try {
        const base = await getBaseUrl();
        await fetch(`${base}/api/cron/match`, {
          headers: { authorization: `Bearer ${process.env.CRON_SECRET || ''}` },
        }).catch(() => {});
      } catch {}

      return NextResponse.json({
        resume: {
          id: resume.id,
          fileName: resume.fileName,
          filePath,
          parseStatus: 'done',
        },
        profile: {
          skillTags: result.skillTags,
          workYears: result.workYears,
          education: result.education,
        },
      });
    } catch (parseErr) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: {
          parseStatus: 'failed',
          parseError: String(parseErr),
        },
      });
      return NextResponse.json({
        resume: { id: resume.id, fileName: resume.fileName, filePath, parseStatus: 'failed', parseError: String(parseErr) },
      }, { status: 200 });
    }
  } catch (err: any) {
    if (err instanceof Response) throw err;
    console.error('resume upload error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
