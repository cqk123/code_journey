import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'slate';
  className?: string;
}

export function Tag({ children, color = 'slate', className }: TagProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-rose-50 text-rose-700',
    yellow: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium transition-colors duration-150',
        colors[color] || colors.slate,
        className
      )}
    >
      {children}
    </span>
  );
}
