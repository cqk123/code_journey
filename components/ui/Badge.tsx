import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'yellow' | 'red' | 'slate' | 'blue';
  className?: string;
}

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
  const colors: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200/50',
    red: 'bg-rose-50 text-rose-700 border-rose-200/50',
    slate: 'bg-slate-100 text-slate-600 border-slate-200/50',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors duration-150',
        colors[variant] || colors.slate,
        className
      )}
    >
      {children}
    </span>
  );
}
