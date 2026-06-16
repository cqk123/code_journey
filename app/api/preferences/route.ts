import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      expectCities: profile ? JSON.parse(profile.expectCities || '[]') : [],
      expectSalaryMin: profile?.expectSalaryMin || null,
      expectSalaryMax: profile?.expectSalaryMax || null,
      expectJobTypes: profile ? JSON.parse(profile.expectJobTypes || '[]') : [],
      expectOrgTypes: profile ? JSON.parse(profile.expectOrgTypes || '[]') : [],
    });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    await prisma.jobSeekerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        expectCities: JSON.stringify(body.expectCities || []),
        expectSalaryMin: body.expectSalaryMin || null,
        expectSalaryMax: body.expectSalaryMax || null,
        expectJobTypes: JSON.stringify(body.expectJobTypes || []),
        expectOrgTypes: JSON.stringify(body.expectOrgTypes || []),
      },
      update: {
        expectCities: JSON.stringify(body.expectCities || []),
        expectSalaryMin: body.expectSalaryMin || null,
        expectSalaryMax: body.expectSalaryMax || null,
        expectJobTypes: JSON.stringify(body.expectJobTypes || []),
        expectOrgTypes: JSON.stringify(body.expectOrgTypes || []),
      },
    });

    // 更新后触发重新匹配
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    fetch(`${base}/api/cron/match`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET || ''}` },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
