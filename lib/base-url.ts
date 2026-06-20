import { headers } from 'next/headers';

/**
 * 自动获取当前部署的 Base URL（不依赖环境变量）
 * 优先从请求头取，确保 SST/SSR 和 API 路由都能拿到正确域名
 */
export async function getBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('host') || h.get('x-forwarded-host') || '';
    const proto = h.get('x-forwarded-proto') || 'https';
    if (host) return `${proto}://${host}`;
  } catch {}
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}
