/**
 * 人岗匹配引擎
 * 纯规则计算：技能 × 经验 × 意向 三维加权打分
 */
import { prisma } from '@/lib/db';

interface MatchInput {
  userSkills: string[];
  userWorkYears: number | null;
  expectCities: string[];
  expectSalaryMin: number | null;
  expectSalaryMax: number | null;
  expectJobTypes: string[];
  expectOrgTypes: string[];
}

interface MatchResult {
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

/**
 * 计算单个用户与单个岗位的匹配得分
 */
function calcMatchScore(job: {
  id: string;
  techStack: string[];
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  jobDirection: string | null;
  companyType: string | null;
}, input: MatchInput): MatchResult {
  // ── 技能匹配（权重 60%）──
  const jobSkills = job.techStack;
  // 改为模糊匹配：用户技能包含岗位标签（或岗位标签包含用户技能），不区分大小写
  const matchedSkills = input.userSkills.filter(us => {
    const ul = us.toLowerCase();
    return jobSkills.some(js => {
      const jl = js.toLowerCase();
      return ul.includes(jl) || jl.includes(ul);
    });
  });
  const missingSkills = jobSkills.filter(js => {
    const jl = js.toLowerCase();
    return !input.userSkills.some(us => {
      const ul = us.toLowerCase();
      return ul.includes(jl) || jl.includes(ul);
    });
  });
  const skillScore = jobSkills.length > 0
    ? (matchedSkills.length / jobSkills.length) * 100
    : 50;

  // ── 经验匹配（权重 20%）──
  let expScore = 60; // 默认
  if (input.userWorkYears !== null) {
    // 无法精确匹配（JD没有结构化经验要求），给予基础分
    expScore = Math.min(input.userWorkYears * 15, 100);
  }

  // ── 意向匹配（权重 20%）──
  let intentScore = 0, intentCount = 0;

  // 城市匹配 (0.4)
  if (job.city && input.expectCities.length > 0) {
    intentScore += input.expectCities.some(c => job.city?.includes(c)) ? 40 : 0;
    intentCount++;
  }

  // 薪资匹配 (0.3)
  if (input.expectSalaryMin && job.salaryMin) {
    const overlap = Math.min(
      (input.expectSalaryMax || 999999) - input.expectSalaryMin,
      (job.salaryMax || 999999) - job.salaryMin
    );
    intentScore += overlap > 0 ? 30 : 5;
    intentCount++;
  }

  // 岗位方向匹配 (0.15)
  if (job.jobDirection && input.expectJobTypes.length > 0) {
    intentScore += input.expectJobTypes.some(j => j === job.jobDirection) ? 15 : 0;
    intentCount++;
  }

  // 单位类型匹配 (0.15)
  if (job.companyType && input.expectOrgTypes.length > 0) {
    intentScore += input.expectOrgTypes.some(o => o === job.companyType) ? 15 : 0;
    intentCount++;
  }

  const normalizedIntent = intentCount > 0 ? intentScore : 50;
  const score = Math.round(skillScore * 0.6 + expScore * 0.2 + normalizedIntent * 0.2);

  return {
    jobId: job.id,
    score: Math.min(score, 100),
    matchedSkills,
    missingSkills,
  };
}

/**
 * 对单个用户运行全量匹配，写入 MatchRecord（批量优化版）
 */
export async function matchForUser(userId: string): Promise<number> {
  const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
  if (!profile) return 0;

  const input: MatchInput = {
    userSkills: JSON.parse(profile.skillTags || '[]'),
    userWorkYears: profile.workYears,
    expectCities: JSON.parse(profile.expectCities || '[]'),
    expectSalaryMin: profile.expectSalaryMin,
    expectSalaryMax: profile.expectSalaryMax,
    expectJobTypes: JSON.parse(profile.expectJobTypes || '[]'),
    expectOrgTypes: JSON.parse(profile.expectOrgTypes || '[]'),
  };

  const jobs = await prisma.jobPosting.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      city: true,
      salaryMin: true,
      salaryMax: true,
      jobDirection: true,
      companyType: true,
      techStack: true,
    },
  });

  const results = jobs.map(job =>
    calcMatchScore(
      { ...job, techStack: JSON.parse(job.techStack as unknown as string || '[]') },
      input
    )
  );

  // 批量写入：先 createMany 忽略冲突，再批量更新
  const matchData = results.map(r => ({
    userId,
    jobId: r.jobId,
    score: r.score,
    matchedSkills: JSON.stringify(r.matchedSkills),
    missingSkills: JSON.stringify(r.missingSkills),
    matchedAt: new Date(),
  }));

  // 批量写入：使用事务包装
  await prisma.$transaction(async (tx) => {
    for (const d of matchData) {
      const existing = await tx.matchRecord.findUnique({
        where: { userId_jobId: { userId: d.userId, jobId: d.jobId } },
      });
      if (existing) {
        await tx.matchRecord.update({
          where: { userId_jobId: { userId: d.userId, jobId: d.jobId } },
          data: {
            score: d.score,
            matchedSkills: d.matchedSkills,
            missingSkills: d.missingSkills,
            matchedAt: d.matchedAt,
          },
        });
      } else {
        await tx.matchRecord.create({ data: d });
      }
    }
  });

  return results.length;
}

/**
 * 对新入库的岗位，匹配所有已激活用户（批量优化版）
 */
export async function matchForJob(jobId: string): Promise<number> {
  const profiles = await prisma.jobSeekerProfile.findMany({
    where: { userId: { not: '' } },
  });

  const job = await prisma.jobPosting.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      city: true,
      salaryMin: true,
      salaryMax: true,
      jobDirection: true,
      companyType: true,
      techStack: true,
    },
  });
  if (!job) return 0;

  const jobWithParsed = { ...job, techStack: JSON.parse(job.techStack as unknown as string || '[]') };

  const results = profiles.map(profile => {
    const input: MatchInput = {
      userSkills: JSON.parse(profile.skillTags || '[]'),
      userWorkYears: profile.workYears,
      expectCities: JSON.parse(profile.expectCities || '[]'),
      expectSalaryMin: profile.expectSalaryMin,
      expectSalaryMax: profile.expectSalaryMax,
      expectJobTypes: JSON.parse(profile.expectJobTypes || '[]'),
      expectOrgTypes: JSON.parse(profile.expectOrgTypes || '[]'),
    };
    return {
      userId: profile.userId,
      ...calcMatchScore(jobWithParsed, input),
    };
  });

  const matchData = results.map(r => ({
    userId: r.userId,
    jobId,
    score: r.score,
    matchedSkills: JSON.stringify(r.matchedSkills),
    missingSkills: JSON.stringify(r.missingSkills),
    matchedAt: new Date(),
  }));

  await prisma.$transaction(async (tx) => {
    for (const d of matchData) {
      const existing = await tx.matchRecord.findUnique({
        where: { userId_jobId: { userId: d.userId, jobId: d.jobId } },
      });
      if (existing) {
        await tx.matchRecord.update({
          where: { userId_jobId: { userId: d.userId, jobId: d.jobId } },
          data: {
            score: d.score,
            matchedSkills: d.matchedSkills,
            missingSkills: d.missingSkills,
            matchedAt: d.matchedAt,
          },
        });
      } else {
        await tx.matchRecord.create({ data: d });
      }
    }
  });

  return results.length;
}

/**
 * 全量匹配（Cron 调用）
 */
export async function matchAll(): Promise<number> {
  const profiles = await prisma.jobSeekerProfile.findMany();
  let total = 0;
  for (const p of profiles) {
    total += await matchForUser(p.userId);
  }
  return total;
}
