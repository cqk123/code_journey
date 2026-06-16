'use client';

import { cn } from '@/lib/utils';

interface SalarySliderProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

const PRESETS = [
  { label: '不限', min: 0, max: 200000 },
  { label: '10k+', min: 10000, max: 200000 },
  { label: '15k+', min: 15000, max: 200000 },
  { label: '20k+', min: 20000, max: 200000 },
  { label: '30k+', min: 30000, max: 200000 },
  { label: '50k+', min: 50000, max: 200000 },
];

export function SalarySlider({ min, max, onChange }: SalarySliderProps) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-2">薪资范围</div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => onChange(p.min, p.max)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
              min === p.min && max === p.max
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {min > 0 && (
        <div className="text-xs text-blue-600 mt-1.5">
          已选：{(min / 1000).toFixed(0)}k+
        </div>
      )}
    </div>
  );
}
