'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { FilterPanel, FilterState } from '@/components/filters/FilterPanel';
import { JobList } from '@/components/jobs/JobList';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const defaultFilters: FilterState = {
  time: 'all',
  cities: [],
  orgTypes: [],
  directions: [],
  salaryMin: 0,
  salaryMax: 200000,
};

export function JobFeedShell() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const queryParams = new URLSearchParams();
  if (filters.time !== 'all') queryParams.set('time', filters.time);
  if (filters.cities.length > 0) queryParams.set('cities', filters.cities.join(','));
  if (filters.orgTypes.length > 0) queryParams.set('orgTypes', filters.orgTypes.join(','));
  if (filters.directions.length > 0) queryParams.set('directions', filters.directions.join(','));
  if (filters.salaryMin > 0) queryParams.set('salaryMin', String(filters.salaryMin));
  if (filters.salaryMax < 200000) queryParams.set('salaryMax', String(filters.salaryMax));
  queryParams.set('pageSize', '20');

  const url = `/api/jobs?${queryParams.toString()}`;
  const { data, isLoading, error, mutate } = useSWR(url, fetcher, { keepPreviousData: true });

  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleSaveFilter() {
    if (!saveName.trim()) {
      setShowSaveInput(true);
      return;
    }
    try {
      const res = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName.trim(), filters }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast('筛选条件已保存', 'success');
      setShowSaveInput(false);
      setSaveName('');
    } catch (err: any) {
      toast(err.message || '保存失败', 'error');
    }
  }

  function goToPage(page: number) {
    setCurrentPage(page);
    const params = new URLSearchParams(queryParams);
    params.set('page', String(page));
    mutate(fetcher(`/api/jobs?${params.toString()}`));
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1">
        <div className="lg:sticky lg:top-20">
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onSave={handleSaveFilter}
            saveName={saveName}
            showSaveInput={showSaveInput}
            onSaveNameChange={setSaveName}
            onSaveConfirm={handleSaveFilter}
            resultCount={data?.total}
          />
        </div>
      </aside>
      <main className="lg:col-span-3">
        <JobList
          jobs={data?.list || []}
          loading={isLoading}
        />
        {/* 分页 */}
        {data && data.total > data.pageSize && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: Math.min(Math.ceil(data.total / data.pageSize), 10) }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={cn(
                  'px-3 py-1.5 rounded text-sm font-medium border transition-colors',
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
