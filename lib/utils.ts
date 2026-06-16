import { type ClassValue, clsx } from 'clsx';

// 简易 class 合并（不用 tailwind-merge 以减少依赖）
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** 生成 6 位数字验证码 */
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** 相对时间展示 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return '刚刚';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}天前`;
  return date.toLocaleDateString('zh-CN');
}

/** 随机 Base64 字符串 */
export function randomToken(length = 64): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
