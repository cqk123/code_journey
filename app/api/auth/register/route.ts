import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendVerifyCode, getLastCode } from '@/lib/mail';
import { generateCode } from '@/lib/utils';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    // 检查是否已注册
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.isVerified) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
    }

    const code = generateCode();
    const passwordHash = await bcrypt.hash(password, 10);

    // 入库（upsert：未验证用户重新注册时更新密码和验证码）
    await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        verifyCode: code,
        verifyCodeExp: new Date(Date.now() + 10 * 60 * 1000),
      },
      create: {
        email,
        passwordHash,
        verifyCode: code,
        verifyCodeExp: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // 发送验证码邮件
    const mailResult = await sendVerifyCode(email, code);

    // 开发模式：浏览器直接返回验证码，方便调试
    const devCode = (mailResult as any).dev ? getLastCode() : null;

    return NextResponse.json({
      message: '验证码已发送',
      ...(devCode ? { devCode, hint: '开发模式，验证码已打印在终端，此外此处也可查看' } : {}),
    });
  } catch (err) {
    console.error('register error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
