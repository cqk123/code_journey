import { cn } from '@/lib/utils';

const colors: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  red: 'bg-red-50 text-red-700',
  slate: 'bg-slate-100 text-slate-600',
};

interface TagProps {
  children: React.ReactNode;
  color?: keyof typeof colors;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Tag({ children, color = 'slate', active, onClick, className }: TagProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
        colors[color],
        active && 'ring-2 ring-blue-500 ring-offset-1',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {children}
    </span>
  );
}
