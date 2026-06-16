/**
 * 岗位抓取原始数据统一结构
 */
export interface JobRawData {
  title: string;
  companyName: string;
  city: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salarySource: string | null;
  companyType: string | null;
  jobDirection: string | null;
  techStack: string[];
  jdText: string;
  sourceUrl: string;
  sourcePlatform: string;
  publishedAt: Date | null;
}

/**
 * 去重 key：标题前20字 + 公司名 + 城市
 */
export function dedupeKey(job: JobRawData): string {
  const title = job.title.trim().slice(0, 20);
  return `${title}|${job.companyName.trim()}|${job.city.trim()}`;
}
