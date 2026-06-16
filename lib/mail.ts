/**
 * 邮件工具 - 发送验证码、匹配汇总
 * 无 SMTP 配置时自动切换为控制台打印 + 响应透传模式
 */
import nodemailer from 'nodemailer';

let devCode: string | null = null;

function transporter() {
  const host = process.env.SMTP_HOST;
  if (!host || host === '') return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const mailer = transporter();

  if (!mailer) {
    const plainText = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    console.log('');
    console.log('══ DEV 邮件模拟 ══');
    console.log('收件人:', to);
    console.log('主题:', subject);
    console.log('内容:', plainText);
    console.log('═══════════════');
    console.log('');
    return { messageId: 'dev-mode', dev: true };
  }

  return mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to, subject, html,
  });
}

export function sendVerifyCode(email: string, code: string) {
  devCode = code;
  return sendMail(
    email,
    '码途 - 邮箱验证码',
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#2563eb">码途 · 邮箱验证</h2>
      <p>你的验证码是：</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1e293b;text-align:center;background:#f1f5f9;padding:16px;border-radius:8px">${code}</p>
      <p style="color:#64748b;font-size:14px">验证码 10 分钟内有效。如非本人操作，请忽略。</p>
    </div>`
  );
}

/** 获取最近一次发送的验证码（供开发调试） */
export function getLastCode(): string | null {
  const c = devCode;
  devCode = null;
  return c;
}
