/**
 * 技术栈关键词白名单 + 分类
 */
const LANGUAGES = ['Java', 'Python', 'Go', 'Rust', 'C++', 'TypeScript', 'JavaScript', 'Kotlin', 'Swift', 'Scala', 'PHP', 'Ruby', 'C#', 'Dart'];
const FRAMEWORKS = ['Spring', 'Spring Boot', 'Spring Cloud', 'MyBatis', 'Hibernate', 'Django', 'Flask', 'FastAPI', 'Express', 'Next.js', 'Nuxt', 'React', 'Vue', 'Angular', 'Gin', 'Echo', 'Fiber', 'Rails', 'Laravel', 'NestJS'];
const DATA = ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'RocketMQ', 'ClickHouse', 'TiDB', 'HBase', 'Hive', 'Spark', 'Flink', 'Hadoop', 'Cassandra'];
const INFRA = ['Docker', 'Kubernetes', 'K8s', 'Helm', 'Terraform', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'Nginx', 'Envoy', 'Istio', 'Prometheus', 'Grafana'];
const AI = ['TensorFlow', 'PyTorch', 'LangChain', 'LLM', 'RAG', 'Agent', 'Transformer', 'MLOps', 'CUDA', 'ONNX', 'HuggingFace', 'Embedding', 'Fine-tuning'];
const CLOUD = ['AWS', 'Azure', 'GCP', '阿里云', '腾讯云', '华为云', 'Serverless', 'Lambda', 'EC2', 'S3'];
const ALL_KEYWORDS = [...LANGUAGES, ...FRAMEWORKS, ...DATA, ...INFRA, ...AI, ...CLOUD];

/**
 * 从纯文本中提取技术栈关键词
 */
export function extractTechStack(text: string): string[] {
  const found = new Set<string>();
  const lower = text;
  for (const kw of ALL_KEYWORDS) {
    if (lower.includes(kw)) {
      found.add(kw);
    }
  }
  return Array.from(found);
}

/**
 * 从 JD 文本推断岗位方向
 */
export function inferJobDirection(title: string, text: string): string | null {
  const combined = (title + ' ' + text.slice(0, 500)).toLowerCase();
  const rules: [string, string[]][] = [
    ['后端', ['后端', '服务端', '后台', 'backend', 'java', 'go', 'golang', 'spring', 'django', '微服务', '分布式']],
    ['前端', ['前端', 'web前端', 'frontend', 'react', 'vue', 'angular', 'javascript', 'typescript', 'h5']],
    ['移动端', ['移动', 'android', 'ios', 'flutter', 'react native', 'app开发', '客户端', 'swift', 'kotlin']],
    ['AI&算法', ['算法', '机器学习', '深度学习', 'nlp', 'cv', '推荐', '大模型', 'llm', 'ai', '模型', '训练', '推理']],
    ['数据', ['数据', 'etl', '数仓', '数据仓库', '数据分析', 'bi', '大数据', 'hadoop', 'spark', 'flink']],
    ['测试&运维', ['测试', '运维', 'qa', '质量', 'devops', 'sre', '自动化测试', 'docker', 'k8s', 'kubernetes']],
    ['全栈', ['全栈', 'fullstack', '全端']],
  ];
  for (const [direction, keywords] of rules) {
    for (const kw of keywords) {
      if (combined.includes(kw)) return direction;
    }
  }
  return '其他';
}

/**
 * 从 JD 文本中提取薪资信息
 */
export function extractSalary(text: string): { min: number | null; max: number | null; source: string | null } {
  // 匹配常见薪资格式：20k-40k, 2万-4万, 20000-40000
  const patterns = [
    /(\d{1,3})\s*k\s*-\s*(\d{1,3})\s*k/i,           // 20k-40k
    /(\d{1,2})\s*万\s*-\s*(\d{1,2})\s*万/,             // 2万-4万
    /(\d{4,6})\s*-\s*(\d{4,6})\s*(?:元|\/月|每月)/,    // 20000-40000
    /(\d{1,3})\s*k\s*-\s*(\d{1,2})\s*万/i,            // 25k-3万
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let min = parseFloat(m[1]);
      let max = parseFloat(m[2]);
      if (m[0].includes('万') && !m[0].includes('k')) {
        min *= 10000; max *= 10000;
      } else if (m[0].includes('k') && !m[0].includes('万')) {
        min *= 1000; max *= 1000;
      }
      if (min < 1000) min *= 10000; // 只给了数字如"2-4"默认按万
      if (max < min * 0.5) max *= 10000;
      return { min, max, source: 'system_inferred' };
    }
  }
  return { min: null, max: null, source: null };
}

/**
 * 推断公司类型
 */
export function inferCompanyType(companyName: string): string | null {
  const megaCorps = ['腾讯', '阿里', '字节', '百度', '美团', '京东', '拼多多', '网易', '快手', '华为', '小米', '蚂蚁', '滴滴', 'B站', 'bilibili', '小红书', '携程', '360', '新浪', '搜狐'];
  const foreignCorps = ['微软', '谷歌', 'Amazon', '亚马逊', 'Apple', '苹果', 'Meta', 'Facebook', 'Shopee', 'Zoom', 'GitHub', 'Stripe', 'Databricks'];
  const stateCorps = ['中国电信', '中国移动', '中国联通', '国家电网', '中石油', '中石化', '中国银行', '工商银行', '建设银行', '农业银行'];

  for (const m of megaCorps) { if (companyName.includes(m)) return '大厂'; }
  for (const f of foreignCorps) { if (companyName.includes(f)) return '外企'; }
  for (const s of stateCorps) { if (companyName.includes(s)) return '国企&央企'; }

  return null;
}
