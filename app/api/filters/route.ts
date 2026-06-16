import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const presets = await prisma.filterPreset.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({
      presets: presets.map(p => ({
        id: p.id,
        name: p.name,
        filters: JSON.parse(p.filterJson),
        createdAt: p.createdAt.toISOString(),
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
    const { name, filters } = await req.json();

    if (!name || !filters) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const count = await prisma.filterPreset.count({ where: { userId: user.id } });
    if (count >= 10) {
      return NextResponse.json({ error: '最多保存10组筛选条件' }, { status: 400 });
    }

    const preset = await prisma.filterPreset.create({
      data: {
        userId: user.id,
        name,
        filterJson: JSON.stringify(filters),
      },
    });

    return NextResponse.json({ preset: { id: preset.id, name: preset.name } });
  } catch (err: any) {
    if (err instanceof Response) throw err;
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
