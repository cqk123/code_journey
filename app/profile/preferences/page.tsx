'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CITIES = ['北京', '上海', '深圳', '杭州', '成都', '广州', '南京', '武汉', '苏州', '西安', '远程'];
const JOB_TYPES = ['后端', '前端', '移动端', 'AI&算法', '数据', '测试&运维', '全栈', '其他'];
const ORG_TYPES = ['大厂', '外企', '国企&央企', '中型企业', '创业公司'];
const SALARY_OPTIONS = [
  { label: '不限', min: null, max: null },
  { label: '10k-20k', min: 10000, max: 20000 },
  { label: '20k-30k', min: 20000, max: 30000 },
  { label: '30k-50k', min: 30000, max: 50000 },
  { label: '50k+', min: 50000, max: null },
];

export default function PreferencesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading, mutate } = useSWR('/api/preferences', fetcher);
  const [saving, setSaving] = useState(false);

  const [expectCities, setExpectCities] = useState<string[]>([]);
  const [expectJobTypes, setExpectJobTypes] = useState<string[]>([]);
  const [expectOrgTypes, setExpectOrgTypes] = useState<string[]>([]);
  const [expectSalaryMin, setExpectSalaryMin] = useState<number | null>(null);
  const [expectSalaryMax, setExpectSalaryMax] = useState<number | null>(null);

  useEffect(() => {
    if (data) {
      setExpectCities(data.expectCities || []);
      setExpectJobTypes(data.expectJobTypes || []);
      setExpectOrgTypes(data.expectOrgTypes || []);
      setExpectSalaryMin(data.expectSalaryMin || null);
      setExpectSalaryMax(data.expectSalaryMax || null);
    }
  }, [data]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectCities,
          expectJobTypes,
          expectOrgTypes,
          expectSalaryMin,
          expectSalaryMax,
        }),
      });
      if (!res.ok) throw new Error();
      toast('求职意向已保存，正在重新匹配岗位', 'success');
      mutate();
      router.push('/recommended');
    } catch {
      toast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  }

  function toggle(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  if (isLoading) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">求职意向设置</h1>

      <div className="space-y-5">
        {/* 期望城市 */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">期望城市</label>
          <div className="flex flex-wrap gap-1.5">
            {CITIES.map(c => (
              <button key={c} onClick={() => toggle(expectCities, setExpectCities, c)} className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                expectCities.includes(c) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              )}>{c}</button>
            ))}
          </div>
        </div>

        {/* 期望岗位 */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">期望岗位方向</label>
          <div className="flex flex-wrap gap-1.5">
            {JOB_TYPES.map(j => (
              <button key={j} onClick={() => toggle(expectJobTypes, setExpectJobTypes, j)} className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                expectJobTypes.includes(j) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              )}>{j}</button>
            ))}
          </div>
        </div>

        {/* 期望单位 */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">期望单位类型</label>
          <div className="flex flex-wrap gap-1.5">
            {ORG_TYPES.map(o => (
              <button key={o} onClick={() => toggle(expectOrgTypes, setExpectOrgTypes, o)} className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                expectOrgTypes.includes(o) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              )}>{o}</button>
            ))}
          </div>
        </div>

        {/* 期望薪资 */}
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">期望薪资范围</label>
          <div className="flex flex-wrap gap-1.5">
            {SALARY_OPTIONS.map(opt => {
              const active = expectSalaryMin === opt.min && expectSalaryMax === opt.max;
              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    setExpectSalaryMin(opt.min);
                    setExpectSalaryMax(opt.max);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                    active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  )}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button onClick={save} loading={saving}>保存并查看推荐</Button>
        <Button variant="ghost" onClick={() => router.push('/')}>返回首页</Button>
      </div>
    </div>
  );
}
