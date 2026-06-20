'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast('两次新密码不一致', 'error'); return; }
    if (newPassword.length < 6) { toast('新密码至少6位', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '修改失败');
      toast('密码已更新', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) { toast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">个人设置</h1>
      <p className="text-slate-500 text-sm mb-8">管理你的账号信息</p>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <h2 className="font-semibold text-slate-700">修改密码</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Input label="当前密码" type="password" placeholder="输入当前密码" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input label="新密码" type="password" placeholder="至少6位" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <Input label="确认新密码" type="password" placeholder="再次输入新密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <Button type="submit" loading={saving}>更新密码</Button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')}>返回首页</Button>
      </div>
    </div>
  );
}
