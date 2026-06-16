'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ResumePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, error, mutate } = useSWR('/api/resume/profile', fetcher);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [editSkills, setEditSkills] = useState('');
  const [showSkillEdit, setShowSkillEdit] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/resume/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok && result.error && !result.resume?.id) {
        throw new Error(result.error || '上传失败');
      }

      if (result.resume?.parseStatus === 'done') {
        toast('简历解析完成！已生成技能画像', 'success');
      } else if (result.resume?.parseStatus === 'failed') {
        toast('简历上传成功但解析失败：' + (result.resume?.parseError || ''), 'error');
      } else {
        toast('简历已上传', 'success');
      }
      mutate();
    } catch (err: any) {
      toast(err.message || '上传失败', 'error');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  async function handleReparse() {
    if (!data?.resumes?.[0]) return;
    setReparsing(true);
    try {
      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: data.resumes[0].id }),
      });
      const result = await res.json();
      if (result.status === 'done') {
        toast('重新解析完成！', 'success');
        mutate();
      } else {
        toast('解析失败：' + (result.error || ''), 'error');
      }
    } catch {
      toast('解析失败', 'error');
    } finally {
      setReparsing(false);
    }
  }

  async function handleSaveSkills() {
    if (!editSkills.trim()) return;
    setSavingSkills(true);
    try {
      const tags = editSkills.split(/[,，、\s]+/).filter(Boolean);
      const res = await fetch('/api/resume/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillTags: tags,
          workYears: data?.profile?.workYears || null,
          education: data?.profile?.education || {},
        }),
      });
      if (!res.ok) throw new Error();
      toast('技能已更新', 'success');
      setShowSkillEdit(false);
      mutate();
    } catch { toast('保存失败', 'error'); }
    finally { setSavingSkills(false); }
  }

  if (error && !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-red-500">加载失败，请先登录</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/auth/login')}>去登录</Button>
      </div>
    );
  }

  const profile = data?.profile;
  const resume = data?.resumes?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">简历管理</h1>

      {/* 上传区域 */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6',
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300',
          uploading && 'pointer-events-none opacity-50'
        )}
      >
        {uploading ? (
          <div>
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-slate-500">正在上传并解析简历...</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📄</div>
            <p className="text-slate-600 font-medium mb-1">
              {resume ? '上传新简历（将覆盖当前简历）' : '拖拽简历文件到此处，或点击选择'}
            </p>
            <p className="text-slate-400 text-sm mb-3">支持 PDF / Word 格式，不超过 10MB</p>
            <label className="cursor-pointer inline-flex items-center px-4 py-2 text-sm rounded-lg font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
              选择文件
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFileChange} />
            </label>
          </div>
        )}
      </div>

      {/* 已上传的简历文件 */}
      {resume && (
        <div className="bg-white rounded-xl border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-800 text-sm">{resume.fileName}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                上传于 {new Date(resume.createdAt).toLocaleString('zh-CN')}
                {resume.parseStatus === 'failed' && <Badge variant="red" className="ml-2">解析失败</Badge>}
                {resume.parseStatus === 'done' && <Badge variant="green" className="ml-2">已解析</Badge>}
                {resume.parseStatus === 'pending' && <Badge variant="yellow" className="ml-2">待解析</Badge>}
              </div>
            </div>
            <button
              onClick={handleReparse}
              disabled={reparsing}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 cursor-pointer"
            >
              {reparsing ? '解析中...' : '重新解析'}
            </button>
          </div>
        </div>
      )}

      {/* 解析结果：技能画像 */}
      {isLoading ? (
        <Skeleton className="h-32" />
      ) : profile ? (
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-500 uppercase">技能标签</h3>
              <button onClick={() => { setShowSkillEdit(!showSkillEdit); setEditSkills((profile?.skillTags || []).join(', ')); }} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                {showSkillEdit ? '取消' : '编辑'}
              </button>
            </div>
            {showSkillEdit ? (
              <div className="space-y-2">
                <textarea
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="输入技能，用逗号或空格分隔，如 Java, Spring Boot, MySQL, Redis"
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveSkills} disabled={savingSkills} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                    {savingSkills ? '保存中...' : '保存技能'}
                  </button>
                  <button onClick={() => setShowSkillEdit(false)} className="px-3 py-1 border text-xs rounded-md text-slate-600 hover:bg-slate-50 cursor-pointer">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.skillTags?.length > 0 ? (
                  profile.skillTags.map((s: string) => (
                    <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{s}</span>
                  ))
                ) : (
                  <span className="text-slate-400 text-sm">暂无技能数据，上传简历后自动提取</span>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 mb-0.5">工作年限</div>
              <div className="font-medium">{profile.workYears ? `${profile.workYears} 年` : '未提取'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">学历</div>
              <div className="font-medium">{profile.education?.degree || '未提取'}</div>
            </div>
          </div>
          {resume && (
            <div className="text-xs text-slate-400 pt-2 border-t">
              最后解析：{new Date(resume.createdAt).toLocaleString('zh-CN')}
              {resume.parseStatus === 'failed' && (
                <Badge variant="red" className="ml-2">解析失败</Badge>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          上传简历后，这里将展示自动提取的技能画像
        </div>
      )}
    </div>
  );
}
