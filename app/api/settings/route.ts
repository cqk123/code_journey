import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    // 修改密码
    if (body.currentPassword && body.newPassword) {
      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: '当前密码错误' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await bcrypt.hash(body.newPassword, 10) },
      });
      return NextResponse.json({ success: true, message: '密码已更新' });
    }

    // 修改通知偏好（可选字段，存储在用户元数据中；MVP先通过前端管理）
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
