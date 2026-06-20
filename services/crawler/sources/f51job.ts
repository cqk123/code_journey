import * as cheerio from 'cheerio';
import { JobRawData } from '../types';

const CITY_MAP: Record<string, string> = {
  北京: '北京', 上海: '上海', 深圳: '深圳', 杭州: '杭州',
  广州: '广州', 成都: '成都', 南京: '南京', 武汉: '武汉',
  苏州: '苏州', 西安: '西安', 长沙: '长沙', 天津: '天津',
};

const KEYWORDS = ['Java', 'Python', '前端', 'Go', '后端', 'AI', '算法'];

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 51job 搜索页抓取
 * 每次随机取一个关键词搜索，避免反爬
 */
export async function fetch51jobJobs(): Promise<JobRawData[]> {
  const kw = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
  const url = `https://search.51job.com/list/000000,000000,0000,00,9,99,${encodeURIComponent(kw)},2,1.html`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: JobRawData[] = [];
    const items = $('.j_joblist .e');

    for (let i = 0; i < items.length && jobs.length < 15; i++) {
      const el = items.eq(i);
      const titleEl = el.find('.jname').first();
      const companyEl = el.find('.cname').first();
      const cityEl = el.find('.d_at').first();

      const title = titleEl.text().trim();
      const companyName = companyEl.text().trim();
      const cityText = cityEl.text().trim();

      if (!title || !companyName) continue;
      if (!isTechJob(title)) continue;

      // 城市匹配
      let city = '';
      for (const [cn, en] of Object.entries(CITY_MAP)) {
        if (cityText.includes(cn)) { city = cn; break; }
      }

      jobs.push({
        title,
        companyName,
        city: city || '未知',
        salaryMin: null,
        salaryMax: null,
        salarySource: null,
        companyType: null,
        jobDirection: null,
        techStack: [],
        jdText: `${companyName} - ${title}\n城市: ${cityText}`,
        sourceUrl: url,
        sourcePlatform: '51job',
        publishedAt: new Date(),
      });
    }

    return jobs;
  } catch {
    return [];
  }
}

function isTechJob(title: string): boolean {
  const techWords = [
    '工程师', '开发', '程序员', 'Java', 'Python', 'Go', 'React', 'Vue',
    '前端', '后端', '全栈', 'DevOps', '算法', 'AI', '大数据', '架构',
    '技术', 'Software', 'Engineer', 'Developer', '测试', '运维',
    'Node', 'TypeScript', 'Rust', 'Golang', 'Kotlin', 'Swift',
  ];
  const lower = title.toLowerCase();
  return techWords.some(w => lower.includes(w));
}
