/**
 * 文件存储适配器 — 本地 / 腾讯云 COS / Vercel Blob 三选一
 *
 * 优先级:
 *   COS_SECRET_ID + COS_SECRET_KEY → 腾讯云 COS（EdgeOne Pages 推荐）
 *   BLOB_READ_WRITE_TOKEN          → Vercel Blob（Vercel 部署）
 *   都没有                          → 本地 public/uploads/（开发用）
 */
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

const isProduction = process.env.NODE_ENV === 'production';

/** 获取 COS 客户端（动态 import，避免本地开发也要装依赖） */
async function getCosClient() {
  const COS = (await import('cos-nodejs-sdk-v5')).default;
  return new COS({
    SecretId: process.env.COS_SECRET_ID!,
    SecretKey: process.env.COS_SECRET_KEY!,
  });
}

export async function uploadResumeBlob(
  file: File,
  userId: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'bin';
  const key = `resumes/${userId}/${Date.now()}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // ── 方式 1：腾讯云 COS ──
  if (process.env.COS_SECRET_ID && process.env.COS_SECRET_KEY) {
    const cos = await getCosClient();
    const bucket = process.env.COS_BUCKET!;
    const region = process.env.COS_REGION || 'ap-guangzhou';

    await new Promise<void>((resolve, reject) => {
      cos.putObject({ Bucket: bucket, Region: region, Key: key, Body: buffer }, (err: any) => {
        err ? reject(err) : resolve();
      });
    });

    return `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
  }

  // ── 方式 2：Vercel Blob ──
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const blob = await put(key, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // ── 方式 3：本地磁盘 ──
  const dir = path.join(process.cwd(), 'public', 'uploads', userId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${Date.now()}-${sanitize(file.name)}`), buffer);
  return `/uploads/${userId}/${Date.now()}-${sanitize(file.name)}`;
}

export async function deleteResumeBlob(url: string) {
  // ── COS ──
  if (url.includes('.cos.') && url.includes('.myqcloud.com')) {
    if (!process.env.COS_SECRET_ID) return;
    const cos = await getCosClient();
    const bucket = process.env.COS_BUCKET!;
    const region = process.env.COS_REGION || 'ap-guangzhou';
    const key = url.split('.myqcloud.com/')[1];
    await new Promise<void>((resolve, reject) => {
      cos.deleteObject({ Bucket: bucket, Region: region, Key: key }, (err: any) => {
        err ? reject(err) : resolve();
      });
    });
    return;
  }

  // ── Vercel Blob ──
  if (url.startsWith('https://') && !url.includes('.cos.')) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    const { del } = await import('@vercel/blob');
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return;
  }

  // ── 本地 ──
  if (url.startsWith('/uploads/')) {
    await unlink(path.join(process.cwd(), 'public', url)).catch(() => {});
  }
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fff._-]/g, '_');
}
