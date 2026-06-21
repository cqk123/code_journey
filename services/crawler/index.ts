import { prisma } from '@/lib/db';
import { JobRawData, dedupeKey } from './types';
import { extractTechStack, inferJobDirection, extractSalary, inferCompanyType } from './extractor';

export async function saveJobs(jobs: JobRawData[]): Promise<{ added: number; updated: number; skipped: number }> {
  let added = 0, updated = 0, skipped = 0;

  for (const job of jobs) {
    const key = dedupeKey(job);

    // 查找是否已存在（按去重key匹配）
    const existing = await prisma.jobPosting.findFirst({
      where: {
        title: { startsWith: job.title.trim().slice(0, 20) },
        companyName: job.companyName.trim(),
        city: job.city.trim(),
        status: { not: 'closed' },
      },
    });

    const techStack = extractTechStack(job.title + ' ' + job.jdText);
    const jobDirection = job.jobDirection || inferJobDirection(job.title, job.jdText);
    const salary = extractSalary(job.jdText);
    const companyType = job.companyType || inferCompanyType(job.companyName);

    const data = {
      title: job.title,
      companyName: job.companyName,
      city: job.city,
      salaryMin: job.salaryMin ?? salary.min,
      salaryMax: job.salaryMax ?? salary.max,
      salarySource: job.salarySource ?? salary.source,
      companyType,
      jobDirection,
      techStack: JSON.stringify(techStack),
      jdFullText: job.jdText,
      sourceUrl: job.sourceUrl,
      sourcePlatform: job.sourcePlatform,
      publishedAt: job.publishedAt || new Date(),
      lastRefreshedAt: new Date(),
      status: 'active' as const,
      freshness: 'today' as const,
    };

    if (existing) {
      await prisma.jobPosting.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.jobPosting.create({ data });
      added++;
    }
  }

  return { added, updated, skipped };
}

/**
 * 定时清理：超过30天未刷新的活跃岗位 → 标记过期
 */
export async function expireOldJobs() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.jobPosting.updateMany({
    where: {
      status: 'active',
      lastRefreshedAt: { lt: cutoff },
    },
    data: { status: 'expired', freshness: 'expired' },
  });
  return result.count;
}
