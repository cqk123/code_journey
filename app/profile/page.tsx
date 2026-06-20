'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, error, mutate } = useSWR('/api/resume/profile', fetcher);
  const { data: prefsData } = useSWR('/api/preferences', fetcher);

  // 简历上传
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 技能编辑
  const [editSkills, setEditSkills] = useState('');
  const [showSkillEdit, setShowSkillEdit] = useState(false);
  const [savingSkills, setSavingSkills] = useState(false);

  // 基本信息编辑
  const [showInfoEdit, setShowInfoEdit] = useState(false);
  const [editWorkYears, setEditWorkYears] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // 重解析
  const [reparsing, setReparsing] = useState(false);

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
    } finally { setUploading(false); }
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
      if (result.status === 'done') { toast('重新解析完成！', 'success'); mutate(); }
      else { toast('解析失败：' + (result.error || ''), 'error'); }
    } catch { toast('解析失败', 'error'); }
    finally { setReparsing(false); }
  }

  async function handleSaveSkills() {
    if (!editSkills.trim()) return;
    setSavingSkills(true);
    try {
      const tags = editSkills.split(/[,，、\s]+/).filter(Boolean);
      const res = await fetch('/api/resume/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillTags: tags, workYears: profile?.workYears || null, education: profile?.education || {} }),
      });
      if (!res.ok) throw new Error();
      toast('技能已更新', 'success');
      setShowSkillEdit(false);
      mutate();
    } catch { toast('保存失败', 'error'); }
    finally { setSavingSkills(false); }
  }

  async function handleSaveInfo() {
    setSavingInfo(true);
    try {
      const workYears = editWorkYears ? parseFloat(editWorkYears) : null;
      const education = editDegree ? { degree: editDegree, major: editMajor || '' } : {};
      const res = await fetch('/api/resume/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillTags: profile?.skillTags || [], workYears, education }),
      });
      if (!res.ok) throw new Error();
      toast('已更新', 'success');
      setShowInfoEdit(false);
      mutate();
    } catch { toast('保存失败', 'error'); }
    finally { setSavingInfo(false); }
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
  const hasPrefs = prefsData?.expectCities?.length > 0 || prefsData?.expectJobTypes?.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">我的</h1>
      <p className="text-slate-500 text-sm mb-6">管理你的简历、技能画像和求职意向</p>

      {/* ═══ 简历上传区域 ═══ */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">简历</h2>
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center transition-colors',
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          {uploading ? (
            <div>
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-500 text-sm">正在上传并解析简历...</p>
            </div>
          ) : resume ? (
            <div className="flex items-center justify-between text-left">
              <div>
                <div className="font-medium text-slate-800 text-sm">{resume.fileName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  上传于 {new Date(resume.createdAt).toLocaleString('zh-CN')}
                  {resume.parseStatus === 'failed' && <Badge variant="red" className="ml-2">解析失败</Badge>}
                  {resume.parseStatus === 'done' && <Badge variant="green" className="ml-2">已解析</Badge>}
                  {resume.parseStatus === 'pending' && <Badge variant="yellow" className="ml-2">待解析</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`/api/resume/download?resumeId=${resume.id}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium">下载</a>
                <button onClick={handleReparse} disabled={reparsing} className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 cursor-pointer">
                  {reparsing ? '解析中...' : '重解析'}
                </button>
                <label className="cursor-pointer inline-flex items-center px-2.5 py-1 text-xs rounded-lg font-medium border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors">
                  更新
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFileChange} />
                </label>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-slate-600 font-medium text-sm mb-1">拖拽简历文件到此处，或点击选择</p>
              <p className="text-slate-400 text-xs mb-3">支持 PDF / Word，不超过 10MB</p>
              <label className="cursor-pointer inline-flex items-center px-4 py-2 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                上传简历
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFileChange} />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 技能画像 ═══ */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">技能画像</h2>
        {isLoading ? (
          <Skeleton className="h-32" />
        ) : profile ? (
          <div className="bg-white rounded-xl border p-5 space-y-4">
            {/* 技能标签 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">技能标签</span>
                <button onClick={() => { setShowSkillEdit(!showSkillEdit); setEditSkills((profile?.skillTags || []).join(', ')); }} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                  {showSkillEdit ? '取消' : '编辑'}
                </button>
              </div>
              {showSkillEdit ? (
                <div className="space-y-2">
                  <textarea value={editSkills} onChange={(e) => setEditSkills(e.target.value)} placeholder="输入技能，用逗号或空格分隔" className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[60px]" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveSkills} disabled={savingSkills} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{savingSkills ? '保存中...' : '保存'}</button>
                    <button onClick={() => setShowSkillEdit(false)} className="px-3 py-1 border text-xs rounded-md text-slate-600 hover:bg-slate-50 cursor-pointer">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.skillTags?.length > 0
                    ? profile.skillTags.map((s: string) => <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">{s}</span>)
                    : <span className="text-slate-400 text-sm">暂无技能数据</span>
                  }
                </div>
              )}
            </div>

            {/* 工作年限 + 学历 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-slate-400">工作年限</span>
                  <button onClick={() => {
                    setShowInfoEdit(true);
                    setEditWorkYears(profile?.workYears?.toString() || '');
                    setEditDegree(profile?.education?.degree || '');
                    setEditMajor(profile?.education?.major || '');
                  }} className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">编辑</button>
                </div>
                {showInfoEdit ? (
                  <input type="number" min="0" max="50" step="0.5" value={editWorkYears} onChange={(e) => setEditWorkYears(e.target.value)} placeholder="如 3" className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                ) : (
                  <div className="font-medium text-sm">{profile.workYears ? `${profile.workYears} 年` : <span className="text-slate-400">未填写</span>}</div>
                )}
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">学历 · 专业</div>
                {showInfoEdit ? (
                  <div className="space-y-1.5">
                    <input value={editDegree} onChange={(e) => setEditDegree(e.target.value)} placeholder="学历，如 本科" className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input value={editMajor} onChange={(e) => setEditMajor(e.target.value)} placeholder="专业，如 计算机科学" className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                ) : (
                  <div className="font-medium text-sm">{profile.education?.degree || profile.education?.major ? `${profile.education.degree || ''} ${profile.education.major || ''}` : <span className="text-slate-400">未填写</span>}</div>
                )}
              </div>
            </div>
            {showInfoEdit && (
              <div className="flex gap-2">
                <button onClick={handleSaveInfo} disabled={savingInfo} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer">{savingInfo ? '保存中...' : '保存'}</button>
                <button onClick={() => setShowInfoEdit(false)} className="px-3 py-1 border text-xs rounded-md text-slate-600 hover:bg-slate-50 cursor-pointer">取消</button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 bg-white rounded-xl border text-slate-400 text-sm">上传简历后，这里将展示自动提取的技能画像</div>
        )}
      </section>

      {/* ═══ 求职意向 ═══ */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">求职意向</h2>
          <Link href="/profile/preferences" className="text-xs text-blue-600 hover:text-blue-700 font-medium">编辑</Link>
        </div>
        {prefsData ? (
          <div className="bg-white rounded-xl border p-5">
            {hasPrefs ? (
              <div className="space-y-2">
                {prefsData.expectCities?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 shrink-0">城市</span>
                    <div className="flex flex-wrap gap-1">
                      {prefsData.expectCities.map((c: string) => <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{c}</span>)}
                    </div>
                  </div>
                )}
                {prefsData.expectJobTypes?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 shrink-0">方向</span>
                    <div className="flex flex-wrap gap-1">
                      {prefsData.expectJobTypes.map((j: string) => <span key={j} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{j}</span>)}
                    </div>
                  </div>
                )}
                {prefsData.expectSalaryMin != null && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 shrink-0">薪资</span>
                    <span className="text-slate-700 text-xs">{prefsData.expectSalaryMin / 1000}k - {prefsData.expectSalaryMax ? `${prefsData.expectSalaryMax / 1000}k` : '不限'}</span>
                  </div>
                )}
                {prefsData.expectOrgTypes?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 shrink-0">类型</span>
                    <div className="flex flex-wrap gap-1">
                      {prefsData.expectOrgTypes.map((o: string) => <span key={o} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{o}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 text-sm py-2">
                尚未设置求职意向，去设置让推荐更精准
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-5 text-center"><Skeleton className="h-12" /></div>
        )}
      </section>

      {/* ═══ 快捷入口 ═══ */}
      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">更多</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/recommended" className="block p-4 bg-white rounded-xl border hover:border-blue-300 transition-colors">
            <div className="font-medium text-slate-800 text-sm">个性化推荐</div>
            <div className="text-xs text-slate-400 mt-0.5">查看与你最匹配的岗位</div>
          </Link>
          <Link href="/saved" className="block p-4 bg-white rounded-xl border hover:border-blue-300 transition-colors">
            <div className="font-medium text-slate-800 text-sm">我的收藏</div>
            <div className="text-xs text-slate-400 mt-0.5">已收藏的岗位列表</div>
          </Link>
          <Link href="/settings" className="block p-4 bg-white rounded-xl border hover:border-blue-300 transition-colors">
            <div className="font-medium text-slate-800 text-sm">账号设置</div>
            <div className="text-xs text-slate-400 mt-0.5">修改密码等</div>
          </Link>
          <Link href="/notifications" className="block p-4 bg-white rounded-xl border hover:border-blue-300 transition-colors">
            <div className="font-medium text-slate-800 text-sm">通知中心</div>
            <div className="text-xs text-slate-400 mt-0.5">查看匹配通知</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
