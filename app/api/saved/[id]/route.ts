import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const saved = await prisma.savedJob.findUnique({ where: { id } });
    if (!saved || saved.userId !== user.id) {
      return NextResponse.json({ error: '收藏不存在' }, { status: 404 });
    }

    await prisma.savedJob.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
