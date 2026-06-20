import { NextResponse } from 'next/server';
import { seedJobs } from '@/services/crawler/sources/seed';
import { saveJobs, expireOldJobs } from '@/services/crawler';
import { fetchV2exJobs } from '@/services/crawler/sources/v2ex';
import { fetch51jobJobs } from '@/services/crawler/sources/f51job';

/**
 * GET /api/cron/crawl
 * 定时触发：清理过期岗位 + 抓取新数据
 * 安全：通过 Authorization header 校验 CRON_SECRET
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    const url = new URL(request.url);
    if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // 清理过期岗位
    const expired = await expireOldJobs();

    // 种子数据：少于 20 条时补充
    const { prisma } = await import('@/lib/db');
    const existingCount = await prisma.jobPosting.count();
    let seedResult: Awaited<ReturnType<typeof saveJobs>> | null = null;
    if (existingCount < 20) {
      seedResult = await saveJobs(seedJobs());
    }

    // 51job 国内直连抓取
    let wuyiResult: Awaited<ReturnType<typeof saveJobs>> | null = null;
    try {
      const wuyiJobs = await fetch51jobJobs();
      if (wuyiJobs.length > 0) {
        wuyiResult = await saveJobs(wuyiJobs);
      }
    } catch (e) {
      console.error('51job crawl error:', e);
    }

    // V2EX 抓取（海外源，经常超时）
    let v2exResult: Awaited<ReturnType<typeof saveJobs>> | null = null;
    try {
      const v2exJobs = await fetchV2exJobs();
      if (v2exJobs.length > 0) {
        v2exResult = await saveJobs(v2exJobs);
      }
    } catch (e) {
      console.error('V2EX crawl error:', e);
    }

    return NextResponse.json({
      success: true,
      expired,
      total: await prisma.jobPosting.count(),
      seed: seedResult,
      wuyi: wuyiResult,
      v2ex: v2exResult,
    });
  } catch (err) {
    console.error('cron crawl error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
