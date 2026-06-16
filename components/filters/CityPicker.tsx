'use client';

import { cn } from '@/lib/utils';

interface CityPickerProps {
  selected: string[];
  onChange: (cities: string[]) => void;
}

const ALL_CITIES = ['北京', '上海', '深圳', '杭州', '成都', '广州', '南京', '武汉', '苏州', '西安', '远程'];

export function CityPicker({ selected, onChange }: CityPickerProps) {
  function toggle(city: string) {
    if (selected.includes(city)) {
      onChange(selected.filter(c => c !== city));
    } else {
      onChange([...selected, city]);
    }
  }

  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-2">城市</div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_CITIES.map(city => (
          <button
            key={city}
            onClick={() => toggle(city)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
              selected.includes(city)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
            )}
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}
