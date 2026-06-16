import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();

    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: user.id },
    });
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      profile: profile ? {
        skillTags: JSON.parse(profile.skillTags || '[]'),
        workYears: profile.workYears,
        education: JSON.parse(profile.educationJson || '{}'),
        expectCities: JSON.parse(profile.expectCities || '[]'),
        expectSalaryMin: profile.expectSalaryMin,
        expectSalaryMax: profile.expectSalaryMax,
        expectJobTypes: JSON.parse(profile.expectJobTypes || '[]'),
        expectOrgTypes: JSON.parse(profile.expectOrgTypes || '[]'),
      } : null,
      resumes: resumes.map(r => ({
        id: r.id,
        fileName: r.fileName,
        parseStatus: r.parseStatus,
        parseError: r.parseError,
        createdAt: r.createdAt.toISOString(),
      })),
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
        skillTags: JSON.stringify(body.skillTags || []),
        workYears: body.workYears || null,
        educationJson: JSON.stringify(body.education || {}),
      },
      update: {
        skillTags: JSON.stringify(body.skillTags || []),
        workYears: body.workYears || null,
        educationJson: JSON.stringify(body.education || {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
