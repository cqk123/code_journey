import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { getSignedDownloadUrl } from '@/lib/blob';

/**
 * GET /api/resume/download?resumeId=xxx
 * 为私有桶简历文件生成带签名的临时下载链接（10 分钟有效），浏览器自动跳转
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');

    if (!resumeId) {
      return NextResponse.json({ error: '缺少 resumeId' }, { status: 400 });
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: '简历不存在' }, { status: 404 });
    }

    const signedUrl = await getSignedDownloadUrl(resume.filePath);
    return NextResponse.redirect(signedUrl);
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
