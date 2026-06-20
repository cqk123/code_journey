/**
 * 文件存储适配器 — 本地 / 腾讯云 COS / Vercel Blob 三选一
 *
 * COS 桶推荐「私有读写」——上传和下载都通过 SDK 鉴权，不怕流量盗刷。
 * 解析器内部用 SDK 直接读 Object，不经过公网 HTTP。
 *
 * 环境变量优先级:
 *   COS_SECRET_ID + COS_SECRET_KEY → 腾讯云 COS
 *   BLOB_READ_WRITE_TOKEN          → Vercel Blob
 *   都没有                          → 本地 public/uploads/
 */
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';

// ── COS SDK 懒加载 ──
let _COS: any;
async function getCos() {
  if (!_COS) {
    _COS = (await import('cos-nodejs-sdk-v5')).default;
  }
  return new _COS({
    SecretId: process.env.COS_SECRET_ID!,
    SecretKey: process.env.COS_SECRET_KEY!,
  });
}

function cosEnabled() {
  return !!(process.env.COS_SECRET_ID && process.env.COS_SECRET_KEY);
}

function cosConfig() {
  return {
    Bucket: process.env.COS_BUCKET!,
    Region: process.env.COS_REGION || 'ap-guangzhou',
  };
}

/** 判断一个 URL 是否指向我们的 COS 私有桶（注意：URL 可能已有签名参数 ?sign=...） */
export function isCosPrivateUrl(url: string) {
  return url.includes('.cos.') && url.includes('.myqcloud.com') && cosEnabled();
}

// ── 上传 ──

export async function uploadResumeBlob(file: File, userId: string): Promise<string> {
  const key = `resumes/${userId}/${Date.now()}-${sanitize(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // 方式 1：腾讯云 COS
  if (cosEnabled()) {
    const cos = await getCos();
    const cfg = cosConfig();
    await new Promise<void>((resolve, reject) => {
      cos.putObject({ Bucket: cfg.Bucket, Region: cfg.Region, Key: key, Body: buffer },
        (err: any) => (err ? reject(err) : resolve())
      );
    });
    // 不管桶公不公开，一律返回不带签名的原始 URL
    return `https://${cfg.Bucket}.cos.${cfg.Region}.myqcloud.com/${key}`;
  }

  // 方式 2：Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    return (await put(key, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN })).url;
  }

  // 方式 3：本地
  const dir = path.join(process.cwd(), 'public', 'uploads', userId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${Date.now()}-${sanitize(file.name)}`), buffer);
  return `/uploads/${userId}/${Date.now()}-${sanitize(file.name)}`;
}

// ── 签名下载 URL（前端或外部需要时调用）──

/** 生成私有桶的临时下载链接（有效期 10 分钟） */
export async function getSignedDownloadUrl(rawUrl: string): Promise<string> {
  if (!isCosPrivateUrl(rawUrl)) return rawUrl;

  const key = rawUrl.split('.myqcloud.com/')[1];
  if (!key) return rawUrl;

  const cos = await getCos();
  const cfg = cosConfig();
  return new Promise((resolve, reject) => {
    cos.getObjectUrl(
      { Bucket: cfg.Bucket, Region: cfg.Region, Key: key, Sign: true, Expires: 600 },
      (err: any, data: { Url: string }) => (err ? reject(err) : resolve(data.Url))
    );
  });
}

// ── COS SDK 直接下载文件内容（解析器用，不走公网）──

/** 私有桶直读——通过 SDK 下载文件 Buffer（不经过 HTTP，不消耗外网流量） */
export async function downloadResumeToBuffer(rawUrl: string): Promise<Buffer> {
  if (!isCosPrivateUrl(rawUrl)) {
    // 非 COS（本地/Vercel Blob）走普通 fetch
    const res = await fetch(rawUrl, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error('下载失败');
    return Buffer.from(await res.arrayBuffer());
  }

  const key = rawUrl.split('.myqcloud.com/')[1];
  const cos = await getCos();
  const cfg = cosConfig();
  return new Promise<Buffer>((resolve, reject) => {
    cos.getObject({ Bucket: cfg.Bucket, Region: cfg.Region, Key: key },
      (err: any, data: { Body: Buffer }) => (err ? reject(err) : resolve(data.Body))
    );
  });
}

// ── 删除 ──

export async function deleteResumeBlob(url: string) {
  if (isCosPrivateUrl(url)) {
    const cos = await getCos();
    const cfg = cosConfig();
    const key = url.split('.myqcloud.com/')[1];
    await new Promise<void>((resolve, reject) => {
      cos.deleteObject({ Bucket: cfg.Bucket, Region: cfg.Region, Key: key },
        (err: any) => (err ? reject(err) : resolve())
      );
    });
    return;
  }

  if (url.startsWith('/uploads/')) {
    await unlink(path.join(process.cwd(), 'public', url)).catch(() => {});
  }
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fff._-]/g, '_');
}
