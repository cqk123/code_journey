'use client';

import React from 'react';
import { CityPicker } from '@/components/filters/CityPicker';
import { SalarySlider } from '@/components/filters/SalarySlider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FilterState {
  time: string;
  cities: string[];
  orgTypes: string[];
  directions: string[];
  salaryMin: number;
  salaryMax: number;
}

const TIME_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: '24h', label: '近24h' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
];

const ORG_TYPES = ['大厂', '外企', '国企&央企', '中型企业', '创业公司'];
const DIRECTIONS = ['后端', '前端', '移动端', 'AI&算法', '数据', '测试&运维', '全栈', '其他'];

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onSave?: () => void;
  saveName?: string;
  showSaveInput?: boolean;
  onSaveNameChange?: (name: string) => void;
  onSaveConfirm?: () => void;
  resultCount?: number;
  className?: string;
}

const btnClass = (active: boolean) =>
  cn(
    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer',
    active ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
  );

const timeBtnClass = (active: boolean) =>
  cn(
    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 cursor-pointer',
    active ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
  );

export function FilterPanel(props: FilterPanelProps) {
  const f = props.filters;
  const onChange = props.onChange;
  const onSave = props.onSave;
  const rc = props.resultCount;

  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...f, [key]: value });
  }

  function toggle(arr: string[], key: keyof FilterState, val: string) {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
    update(key, next as any);
  }

  function clearAll() {
    onChange({ time: 'all', cities: [], orgTypes: [], directions: [], salaryMin: 0, salaryMax: 200000 });
  }

  const hasFilters = f.cities.length > 0 || f.orgTypes.length > 0 || f.directions.length > 0 || f.salaryMin > 0 || f.time !== 'all';

  return React.createElement('div', {
    className: cn('glass-card p-5 space-y-4', props.className),
    children: [
      React.createElement('div', { key: 'time', children: [
        React.createElement('div', { key: 'label', className: 'text-xs font-medium text-slate-500 mb-2', children: '时间' }),
        React.createElement('div', { key: 'btns', className: 'flex gap-1', children: TIME_OPTIONS.map(t =>
          React.createElement('button', {
            key: t.value, onClick: () => update('time', t.value),
            className: timeBtnClass(f.time === t.value), children: t.label,
          })
        )}),
      ]}),
      React.createElement(CityPicker, {
        key: 'city', selected: f.cities,
        onChange: (cities: string[]) => update('cities', cities),
      }),
      React.createElement('div', { key: 'org', children: [
        React.createElement('div', { key: 'label', className: 'text-xs font-medium text-slate-500 mb-2', children: '单位类型' }),
        React.createElement('div', { key: 'btns', className: 'flex flex-wrap gap-1.5', children: ORG_TYPES.map(t =>
          React.createElement('button', {
            key: t, onClick: () => toggle(f.orgTypes, 'orgTypes', t),
            className: btnClass(f.orgTypes.includes(t)), children: t,
          })
        )}),
      ]}),
      React.createElement('div', { key: 'dir', children: [
        React.createElement('div', { key: 'label', className: 'text-xs font-medium text-slate-500 mb-2', children: '岗位方向' }),
        React.createElement('div', { key: 'btns', className: 'flex flex-wrap gap-1.5', children: DIRECTIONS.map(d =>
          React.createElement('button', {
            key: d, onClick: () => toggle(f.directions, 'directions', d),
            className: btnClass(f.directions.includes(d)), children: d,
          })
        )}),
      ]}),
      React.createElement(SalarySlider, {
        key: 'salary', min: f.salaryMin, max: f.salaryMax,
        onChange: (min: number, max: number) => { update('salaryMin', min); update('salaryMax', max); },
      }),
      React.createElement('div', { key: 'bottom', className: 'space-y-2 pt-2 border-t', children: [
        props.showSaveInput
          ? React.createElement('div', { key: 'save', className: 'flex gap-2', children: [
              React.createElement('input', {
                key: 'input', type: 'text', placeholder: '输入筛选名称，如"北京后端 20k+"',
                value: props.saveName || '', autoFocus: true,
                onChange: (e: any) => props.onSaveNameChange?.(e.target.value),
                className: 'flex-1 px-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500',
              }),
              React.createElement(Button, { key: 'confirm', size: 'sm', onClick: props.onSaveConfirm, children: '确认' }),
            ]})
          : null,
        React.createElement('div', { key: 'actions', className: 'flex items-center justify-between', children: [
          React.createElement('div', { key: 'count', className: 'text-sm text-slate-400', children: rc !== undefined ? `共 ${rc} 个岗位` : '' }),
          React.createElement('div', { key: 'buttons', className: 'flex gap-2', children: [
            hasFilters ? React.createElement(Button, { key: 'clear', variant: 'ghost', size: 'sm', onClick: clearAll, children: '清除筛选' }) : null,
            (onSave && hasFilters)
              ? React.createElement(Button, { key: 'save', variant: 'outline', size: 'sm', onClick: onSave, children: '保存筛选' })
              : null,
          ].filter(Boolean) }),
        ]}),
      ].filter(Boolean) }),
    ].filter(Boolean),
  });
}
