'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CITIES = Object.entries({
  '北京': true, '上海': true, '深圳': true, '杭州': true, '成都': true,
  '广州': true, '南京': true, '武汉': true, '苏州': true, '西安': true, '远程': true,
}).map(([k]) => k);
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
        body: JSON.stringify({ expectCities, expectJobTypes, expectOrgTypes, expectSalaryMin, expectSalaryMax }),
      });
      if (!res.ok) throw new Error();
      toast('求职意向已保存', 'success');
      mutate();
    } catch { toast('保存失败', 'error'); }
    finally { setSaving(false); }
  }

  function toggle(arr: string[], set: (v: string[]) => void, val: string) {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }

  const chipClass = (active: boolean) => cn(
    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer',
    active ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
  );

  if (isLoading) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">求职意向</h1>
      <p className="text-slate-500 text-sm mb-8">设置你的期望，让推荐更精准</p>

      <div className="space-y-6">
        {[
          { label: '期望城市', items: CITIES, selected: expectCities, set: setExpectCities },
          { label: '期望岗位方向', items: JOB_TYPES, selected: expectJobTypes, set: setExpectJobTypes },
          { label: '期望单位类型', items: ORG_TYPES, selected: expectOrgTypes, set: setExpectOrgTypes },
        ].map(group => (
          <div key={group.label} className="glass-card p-5">
            <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">{group.label}</label>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item: string) => (
                <button key={item} onClick={() => toggle(group.selected, group.set, item)}
                  className={chipClass(group.selected.includes(item))}>{item}</button>
              ))}
            </div>
          </div>
        ))}

        <div className="glass-card p-5">
          <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">期望薪资范围</label>
          <div className="flex flex-wrap gap-2">
            {SALARY_OPTIONS.map(opt => {
              const active = expectSalaryMin === opt.min && expectSalaryMax === opt.max;
              return (
                <button key={opt.label}
                  onClick={() => { setExpectSalaryMin(opt.min); setExpectSalaryMax(opt.max); }}
                  className={chipClass(active)}>{opt.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button onClick={save} loading={saving} className="shadow-sm shadow-blue-500/20">保存并返回</Button>
        <Button variant="ghost" onClick={() => router.back()}>取消</Button>
      </div>
    </div>
  );
}
