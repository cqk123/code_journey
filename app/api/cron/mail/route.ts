import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMail } from '@/lib/mail';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !url.hostname.includes('localhost')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 查询最近24小时内匹配度≥60的用户，按用户分组汇总
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const matches = await prisma.matchRecord.findMany({
      where: { score: { gte: 60 }, matchedAt: { gte: cutoff } },
      include: { user: true, job: true },
      orderBy: { score: 'desc' },
      take: 100,
    });

    // 按用户分组
    const userMatches = new Map<string, { user: any; jobs: any[] }>();
    for (const m of matches) {
      if (!userMatches.has(m.userId)) {
        userMatches.set(m.userId, { user: m.user, jobs: [] });
      }
      userMatches.get(m.userId)!.jobs.push(m.job);
    }

    let sent = 0;
    for (const [_, { user, jobs }] of userMatches) {
      const topJobs = jobs.slice(0, 5);
      const jobList = topJobs.map(j => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">
            <strong>${j.title}</strong><br/>
            <span style="color:#64748b;font-size:13px">${j.companyName} · ${j.city || '未知'} · ${j.salaryMin ? (j.salaryMin / 1000).toFixed(0) + 'k-' + (j.salaryMax ? (j.salaryMax / 1000).toFixed(0) + 'k' : '') : '薪资面议'}</span>
          </td>
        </tr>
      `).join('');

      try {
        await sendMail(
          user.email,
          `码途 · 本周匹配岗位（${jobs.length}个）`,
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#2563eb">码途 · 岗位匹配周报</h2>
            <p>过去一周有 <strong>${jobs.length}</strong> 个岗位与你的技能匹配，以下是 TOP ${topJobs.length}：</p>
            <table style="width:100%;border-collapse:collapse">${jobList}</table>
            <p style="margin-top:16px"><a href="${process.env.NEXT_PUBLIC_BASE_URL}/recommended" style="color:#2563eb">查看全部推荐 →</a></p>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">你可以在 <a href="${process.env.NEXT_PUBLIC_BASE_URL}/settings">个人设置</a> 中关闭邮件通知。</p>
          </div>`
        );
        sent++;
      } catch (e) {
        console.error('send mail error:', user.email, e);
      }
    }

    return NextResponse.json({ success: true, sent, totalUsers: userMatches.size });
  } catch (err) {
    console.error('mail cron error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
