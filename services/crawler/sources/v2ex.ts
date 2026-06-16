import * as cheerio from 'cheerio';
import { JobRawData } from '../types';

const BASE = 'https://www.v2ex.com';

/**
 * V2EX 酷工作板块抓取
 * 抓取帖子的标题、内容（JD）、发帖时间
 */
export async function fetchV2exJobs(): Promise<JobRawData[]> {
  try {
    const res = await fetch(`${BASE}/go/jobs?tab=all`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: JobRawData[] = [];

    const items = $('.cell.item');
    for (let i = 0; i < items.length; i++) {
      const el = items.eq(i);
      const titleEl = el.find('.item_title a');
      const title = titleEl.text().trim();
      const href = titleEl.attr('href') || '';
      const topicId = href.split('/').pop()?.split('#')[0] || '';
      const username = el.find('.topic_info strong a').first().text().trim();
      const timeText = el.find('.topic_info span').first().text().trim();

      // 解析时间
      let publishedAt: Date | null = null;
      if (timeText) {
        const now = new Date();
        const match1 = timeText.match(/(\d+)\s*分钟前/);
        const match2 = timeText.match(/(\d+)\s*小时前/);
        const match3 = timeText.match(/(\d+)\s*天前/);
        if (match1) publishedAt = new Date(now.getTime() - parseInt(match1[1]) * 60 * 1000);
        else if (match2) publishedAt = new Date(now.getTime() - parseInt(match2[1]) * 60 * 60 * 1000);
        else if (match3) publishedAt = new Date(now.getTime() - parseInt(match3[1]) * 24 * 60 * 60 * 1000);
        else publishedAt = now;
      }

      // 尝试抓取帖子正文获取更多 JD 信息
      let jdText = title;
      let city = '';

      // 从标题提取城市信息
      const cityPatterns: [RegExp, string][] = [
        [/\[北京\]/i, '北京'], [/\[上海\]/i, '上海'], [/\[深圳\]/i, '深圳'],
        [/\[杭州\]/i, '杭州'], [/\[广州\]/i, '广州'], [/\[成都\]/i, '成都'],
        [/\[南京\]/i, '南京'], [/\[武汉\]/i, '武汉'], [/\[苏州\]/i, '苏州'],
        [/\[远程\]/i, ''], [/\[Remote\]/i, ''],
      ];
      for (const [p, c] of cityPatterns) {
        if (p.test(title)) { city = c || '远程'; break; }
      }

      if (topicId) {
        try {
          const detailRes = await fetch(`${BASE}/t/${topicId}?p=1`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            signal: AbortSignal.timeout(10000),
          });
          if (detailRes.ok) {
            const detailHtml = await detailRes.text();
            const $$ = cheerio.load(detailHtml);
            const content = $$('.topic_content').first().text().trim();
            if (content) jdText = title + '\n\n' + content;

            // 从正文提取城市（如果没有从标题提取到）
            if (!city) {
              for (const [p, c] of cityPatterns) {
                if (p.test(content)) { city = c || '远程'; break; }
              }
            }
          }
        } catch { /* skip detail fetch */ }
      }

      // 只收录与计算机开发相关的帖子
      if (!isTechJob(title)) continue;

      jobs.push({
        title,
        companyName: username || '未知公司',
        city: city || '未知',
        salaryMin: null,
        salaryMax: null,
        salarySource: null,
        companyType: null,
        jobDirection: null,
        techStack: [],
        jdText,
        sourceUrl: `${BASE}/t/${topicId}`,
        sourcePlatform: 'v2ex',
        publishedAt,
      });

      // 请求间隔
      await sleep(2000);
    }

    return jobs;
  } catch {
    return [];
  }
}

function isTechJob(title: string): boolean {
  const techWords = ['工程师', '开发', '程序员', 'java', 'python', 'go', 'react', 'vue', '前端', '后端', '全栈', 'devops', 'sre', '算法', 'ai', '大模型', '数据', '架构', '技术', 'eng', 'software', 'engineer', 'developer'];
  const lower = title.toLowerCase();
  return techWords.some(w => lower.includes(w));
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
