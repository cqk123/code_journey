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
  const [sentCode, setSentCode] = useState<string | null>(null);

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

      if (data.code) {
        setSentCode(data.code);
        toast('验证码已生成', 'success');
      } else {
        toast('验证码已发送到你的邮箱', 'success');
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
          验证码已发送至 <strong>{email}</strong>
        </p>
        {sentCode && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-center">
            <p className="text-xs text-slate-500 mb-2">你的验证码</p>
            <div className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-700">{sentCode}</div>
            <p className="text-xs text-slate-400 mt-2">10 分钟内有效</p>
          </div>
        )}
        <Input
          label="验证码"
          placeholder="输入 6 位验证码"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value)}
          maxLength={6}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          验证并登录
        </Button>
        <button type="button" onClick={() => { setStep('form'); setSentCode(null); }} className="w-full text-sm text-slate-500 hover:text-slate-700">
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
