import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { prisma } from './db';

/**
 * 从 cookie 中获取当前登录用户。
 * 未登录返回 null。
 */
export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { profile: true },
  });
}

/**
 * 要求登录，否则抛出 Response（用于 API 路由）。
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: '请先登录' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
