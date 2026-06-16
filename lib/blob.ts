/**
 * Vercel Blob 工具 - 简历文件上传/删除
 * 本地开发时模拟（存到本地 public/uploads/）
 */
import { put, del } from '@vercel/blob';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export async function uploadResumeBlob(file: File, userId: string): Promise<string> {
  // Vercel 生产环境：存到 Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`resumes/${userId}/${Date.now()}-${file.name}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // 本地开发：存到 public/uploads/
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${file.name}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', userId);
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/${userId}/${fileName}`;
}

export async function deleteResumeBlob(url: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return;
  }

  // 本地开发：删除本地文件
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', url);
    await unlink(filePath).catch(() => {});
  }
}
