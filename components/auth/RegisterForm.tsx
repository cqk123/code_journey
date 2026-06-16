'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast('两次密码不一致', 'error');
      return;
    }
    if (password.length < 6) {
      toast('密码至少6位', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');
      toast('验证码已发送到你的邮箱', 'success');
      if (data.devCode) {
        setDevCode(data.devCode);
        toast('开发模式：验证码为 ' + data.devCode, 'info');
      }
      setStep('verify');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '验证失败');
      toast('验证成功！已自动登录', 'success');
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-slate-600">
          验证码已发送至 <strong>{email}</strong>，请查收邮件
        </p>
        {devCode && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <div className="text-xs text-yellow-700 mb-1">🔧 开发模式：无需查邮箱</div>
            <div className="text-2xl font-bold tracking-[0.3em] text-yellow-800">{devCode}</div>
          </div>
        )}
        <Input
          label="验证码"
          placeholder="6位数字"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value)}
          maxLength={6}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          验证并登录
        </Button>
        <button type="button" onClick={() => { setStep('form'); setDevCode(null); }} className="w-full text-sm text-slate-500 hover:text-slate-700">
          返回修改邮箱
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <Input
        label="邮箱"
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="密码"
        type="password"
        placeholder="至少6位"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Input
        label="确认密码"
        type="password"
        placeholder="再次输入密码"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      <Button type="submit" loading={loading} className="w-full">
        注册
      </Button>
      <p className="text-center text-sm text-slate-500">
        已有账号？<Link href="/auth/login" className="text-blue-600 hover:underline">登录</Link>
      </p>
    </form>
  );
}
