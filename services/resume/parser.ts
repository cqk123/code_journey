/**
 * PDF/Word 文本提取 + 技能关键词解析
 */
import mammoth from 'mammoth';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { downloadResumeToBuffer, isCosPrivateUrl } from '@/lib/blob';

const TECH_KEYWORDS = [
  'Java', 'Python', 'Go', 'Golang', 'Rust', 'C++', 'TypeScript', 'JavaScript', 'Kotlin', 'Swift', 'Scala', 'PHP', 'Ruby', 'C#', 'Dart',
  'Spring', 'Spring Boot', 'Spring Cloud', 'MyBatis', 'Hibernate', 'Django', 'Flask', 'FastAPI',
  'Express', 'Next.js', 'Nuxt', 'React', 'Vue', 'Angular', 'Gin', 'Echo', 'Fiber', 'Rails', 'Laravel', 'NestJS',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'ES', 'Kafka', 'RabbitMQ', 'RocketMQ', 'MQ',
  'ClickHouse', 'Spark', 'Flink', 'Hadoop', 'Hive', 'Cassandra',
  'Docker', 'Kubernetes', 'K8s', 'Helm', 'Terraform', 'Jenkins', 'CI/CD', 'GitHub Actions',
  'Nginx', 'Envoy', 'Prometheus', 'Grafana', '微服务', '分布式',
  'TensorFlow', 'PyTorch', 'LangChain', 'LLM', '大模型', 'RAG', 'Agent', 'Transformer', '深度学习', '机器学习',
  'AWS', 'Azure', 'GCP', '阿里云', '腾讯云', '华为云', 'Serverless',
  'Git', 'Linux', 'Node.js', 'SQL', 'NoSQL', 'RESTful', 'gRPC', 'WebSocket', 'MQTT',
  'HTML', 'CSS', 'Sass', 'Webpack', 'Vite', 'Babel', 'ES6', 'ESLint', 'Prettier',
  'JWT', 'OAuth', 'SSO', '微前端', '低代码', 'Figma', 'Tableau',
  'Android', 'iOS', 'Flutter', 'React Native', 'Electron', 'Tauri',
  'OpenCV', 'NLP', 'CV', 'Spark ML', 'Sklearn', 'Pandas', 'NumPy',
];

interface ParseResult {
  skillTags: string[];
  workYears: number | null;
  education: { degree: string; major: string };
}

function extractSkills(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const kw of TECH_KEYWORDS) {
    const kwLower = kw.toLowerCase();
    if (lower.includes(kwLower)) found.add(kw);
  }
  return Array.from(found);
}

function extractWorkYears(text: string): number | null {
  // 多个正则模式匹配
  const patterns = [
    /(\d+)\s*年(?:\s*(?:以上|及以上|左右|开发|工作|经验|相关工作经验))/i,
    /(\d+)\s*[-~到]\s*(\d+)\s*年/i,
    /工作\s*年限\s*[:：]?\s*(\d+)\s*年/i,
    /工作\s*经验\s*[:：]?\s*(\d+)\s*年/i,
    /(\d+)\s*years/i,
    /(\d+)\s*-\s*(\d+)\s*(?:年|yr)/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = m[2] ? parseInt(m[2]) : parseInt(m[1]);
      if (n >= 0 && n <= 50) return n;
    }
  }
  return null;
}

function extractEducation(text: string): { degree: string; major: string } {
  const degreeMap: [RegExp, string][] = [
    [/博士/i, '博士'], [/硕士|研究生/i, '硕士'],
    [/本科|学士/i, '本科'], [/大专|专科/i, '大专'],
  ];
  const majorMap: [RegExp, string][] = [
    [/计算机科学|计算机科学与技术|计算机应用|软件工程/i, '计算机科学'],
    [/电子信息|通信工程|自动化|电气/i, '电子信息'],
    [/数学|应用数学|统计|信息与计算/i, '数学/统计'],
    [/人工智能|数据科学|智能科学/i, '人工智能'],
  ];
  let degree = '未知', major = '未知';
  for (const [re, d] of degreeMap) { if (re.test(text)) { degree = d; break; } }
  for (const [re, m] of majorMap) { if (re.test(text)) { major = m; break; } }
  return { degree, major };
}

/**
 * PDF 文本提取（pdf2json + 原始回退）
 */
async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const PDFParser = require('pdf2json');
    const parser = new PDFParser();

    const text = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        try { parser.destroy?.(); } catch {}
        resolve('');
      }, 30000);

      parser.on('pdfParser_dataReady', (evtData: any) => {
        clearTimeout(timer);
        try {
          const texts: string[] = [];
          const pages = evtData?.Pages || evtData?.formImage?.Pages || [];
          for (const page of pages) {
            for (const text of page.Texts || []) {
              const decoded = decodeURIComponent(text.R?.[0]?.T || '');
              if (decoded && decoded.trim()) texts.push(decoded.trim());
            }
          }
          resolve(texts.join(' '));
        } catch (e) {
          resolve('');
        }
      });

      parser.on('pdfParser_dataError', () => {
        clearTimeout(timer);
        resolve('');
      });

      parser.parseBuffer(buffer);
    });

    if (text && text.length > 10) return text;

    // pdf2json 提取为空或太短，尝试原始提取
    const raw = tryRawExtract(buffer);
    if (raw && raw.length > 10) return raw;

    return text || raw || '';
  } catch {
    return tryRawExtract(buffer) || '';
  }
}

function tryRawExtract(buffer: Buffer): string {
  const str = buffer.toString('utf-8');
  const texts: string[] = [];

  // BT...ET 块
  const btRegex = /BT\s*([\s\S]*?)\s*ET/g;
  let match;
  while ((match = btRegex.exec(str)) !== null) {
    const block = match[1];
    // (text) Tj
    let tm;
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    while ((tm = tjRegex.exec(block)) !== null) {
      texts.push(tm[1]);
    }
    // TJ arrays
    const tjArrRegex = /\[([^\]]*)\]\s*TJ/g;
    while ((tm = tjArrRegex.exec(block)) !== null) {
      const parts = tm[1].match(/\(([^)]*)\)/g) || [];
      texts.push(...parts.map(p => p.slice(1, -1)));
    }
  }

  if (texts.length > 0) return texts.join(' ');

  // 暴力：去除非可见字符，保留中英文
  return str.replace(/[^\x20-\x7E\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getFileType(filePath: string): 'pdf' | 'docx' | 'txt' {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
  return 'txt';
}

async function readLocalFile(filePath: string): Promise<string> {
  const cwd = process.cwd();
  const absolutePath = filePath.startsWith('/')
    ? path.join(cwd, 'public', filePath)
    : path.join(cwd, filePath);

  const stats = await stat(absolutePath).catch(() => null);
  if (!stats) throw new Error(`文件不存在: ${absolutePath}`);

  const buffer = await readFile(absolutePath);
  const fileType = getFileType(filePath);

  if (fileType === 'pdf') return parsePDF(buffer);
  if (fileType === 'docx') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString('utf-8');
}

async function fetchRemoteFile(url: string): Promise<string> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('下载失败');
  const buffer = Buffer.from(await res.arrayBuffer());
  const lower = url.toLowerCase();

  if (lower.includes('.pdf') || lower.endsWith('.pdf')) return parsePDF(buffer);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parseResume(textOrFile: string): Promise<ParseResult> {
  let text: string;

  // ── COS 私有桶：用 SDK 直读（不走公网，不烧流量）──
  if (isCosPrivateUrl(textOrFile)) {
    const buffer = await downloadResumeToBuffer(textOrFile);
    const fileType = getFileType(textOrFile);
    text = fileType === 'pdf' ? await parsePDF(buffer) : (await mammoth.extractRawText({ buffer })).value;
  } else if (textOrFile.startsWith('http://') || textOrFile.startsWith('https://')) {
    text = await fetchRemoteFile(textOrFile);
  } else if (textOrFile.startsWith('/uploads/') || /\.(pdf|docx?)$/i.test(textOrFile)) {
    text = await readLocalFile(textOrFile);
  } else {
    text = textOrFile;
  }

  console.log('[parser] extracted text length:', text?.length || 0, 'first 100 chars:', (text || '').slice(0, 100));

  const skillTags = extractSkills(text);
  const workYears = extractWorkYears(text);
  const education = extractEducation(text);

  return { skillTags, workYears, education };
}
