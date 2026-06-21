import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUser } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = await getUser().catch(() => null);

    // 筛选参数
    const time = searchParams.get('time') || 'all';
    const cities = searchParams.get('cities')?.split(',').filter(Boolean) || [];
    const orgTypes = searchParams.get('orgTypes')?.split(',').filter(Boolean) || [];
    const directions = searchParams.get('directions')?.split(',').filter(Boolean) || [];
    const salaryMin = parseInt(searchParams.get('salaryMin') || '0');
    const salaryMax = parseInt(searchParams.get('salaryMax') || '200000');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 50);
    const matched = searchParams.get('matched') === 'true';

    // 时间过滤
    const timeFilters: Record<string, Date> = {
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    };

    const where: Prisma.JobPostingWhereInput = {
      status: 'active',
    };

    if (time && time !== 'all' && timeFilters[time]) {
      where.lastRefreshedAt = { gte: timeFilters[time] };
    }
    if (cities.length > 0) {
      where.city = { in: cities };
    }
    if (orgTypes.length > 0) {
      where.companyType = { in: orgTypes };
    }
    if (directions.length > 0) {
      where.jobDirection = { in: directions };
    }

    // 薪资过滤（只筛选有薪资数据的）
    if (salaryMin > 0) {
      where.salaryMax = { gte: salaryMin };
    }
    if (salaryMax < 200000) {
      where.salaryMin = { lte: salaryMax };
    }

    // 推荐Feed模式
    if (matched && user) {
      const matchIds = await prisma.matchRecord.findMany({
        where: { userId: user.id, score: { gte: 60 } },
        orderBy: { score: 'desc' },
        select: { jobId: true },
      });
      where.id = { in: matchIds.map(m => m.jobId) };
    }

    const [total, jobs] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.findMany({
        where,
        orderBy: { lastRefreshedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          companyName: true,
          companyType: true,
          city: true,
          salaryMin: true,
          salaryMax: true,
          salarySource: true,
          jobDirection: true,
          techStack: true,
          lastRefreshedAt: true,
          sourcePlatform: true,
          freshness: true,
        },
      }),
    ]);

    // 获取用户收藏和匹配信息
    let savedJobs: Set<string> = new Set();
    let matchScores: Record<string, number> = {};
    if (user) {
      const [saved, matches] = await Promise.all([
        prisma.savedJob.findMany({
          where: { userId: user.id, jobId: { in: jobs.map(j => j.id) } },
          select: { jobId: true },
        }),
        prisma.matchRecord.findMany({
          where: { userId: user.id, jobId: { in: jobs.map(j => j.id) } },
          select: { jobId: true, score: true },
        }),
      ]);
      savedJobs = new Set(saved.map(s => s.jobId));
      matchScores = Object.fromEntries(matches.map(m => [m.jobId, m.score]));
    }

    const list = jobs.map(job => ({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      companyType: job.companyType,
      city: job.city,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salarySource: job.salarySource,
      jobDirection: job.jobDirection,
      techStack: JSON.parse(job.techStack || '[]'),
      lastRefreshedAt: job.lastRefreshedAt?.toISOString() || null,
      freshness: job.freshness,
      sourcePlatform: job.sourcePlatform,
      matchScore: matchScores[job.id] || null,
      isSaved: savedJobs.has(job.id),
    }));

    return NextResponse.json(
      { total, page, pageSize, list },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('jobs error:', err);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
