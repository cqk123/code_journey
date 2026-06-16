import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: '邮箱和验证码不能为空' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: '未找到该邮箱的注册记录' }, { status: 404 });
    }

    if (user.verifyCode !== code) {
      return NextResponse.json({ error: '验证码错误' }, { status: 400 });
    }

    if (user.verifyCodeExp && new Date() > user.verifyCodeExp) {
      return NextResponse.json({ error: '验证码已过期，请重新注册' }, { status: 400 });
    }

    // 验证通过
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyCode: null, verifyCodeExp: null },
    });

    // 自动创建画像
    await prisma.jobSeekerProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    // 签发 JWT
    const token = signToken({ userId: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ message: '验证成功' });
  } catch (err) {
    console.error('verify error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
