import { NextResponse } from 'next/server';
import { seedJobs } from '@/services/crawler/sources/seed';
import { saveJobs, expireOldJobs } from '@/services/crawler';
import { fetchV2exJobs } from '@/services/crawler/sources/v2ex';

/**
 * GET /api/cron/crawl
 * Vercel Cron 定时触发：执行岗位抓取
 * 安全：通过 Authorization header 校验 CRON_SECRET
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 开发/localhost 环境下允许无密钥访问（方便测试）
    const url = new URL(request.url);
    if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // 清理过期岗位
    const expired = await expireOldJobs();

    // 种子数据（首次运行或数据少时补充）
    const existingCount = await (await import('@/lib/db')).prisma.jobPosting.count();
    let seedResult: Awaited<ReturnType<typeof saveJobs>> | null = null;
    if (existingCount < 10) {
      seedResult = await saveJobs(seedJobs());
    }

    // V2EX 抓取
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
      seed: seedResult,
      v2ex: v2exResult,
    });
  } catch (err) {
    console.error('cron crawl error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
